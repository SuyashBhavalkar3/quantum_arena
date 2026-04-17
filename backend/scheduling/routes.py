from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from authentication.database import get_db
from authentication.utils import get_current_user
from authentication.models import User
from notifications.models import Notification, Schedule, NotificationType
from applications.models import Application, ApplicationStatus
from pydantic import BaseModel, Field
from middleware.rate_limiter import rate_limiter
from notifications.email_service import *

router = APIRouter(prefix="/v1/scheduling", tags=["Scheduling & Notifications"], dependencies=[Depends(rate_limiter)])

class ScheduleCreate(BaseModel):
    application_id: int
    schedule_type: str = Field(..., pattern="^(assessment|interview)$")
    scheduled_time: datetime
    duration_minutes: int = Field(default=60, ge=15, le=240)

class ScheduleResponse(BaseModel):
    id: int
    application_id: int
    schedule_type: str
    scheduled_time: datetime
    duration_minutes: int
    reminder_sent: bool
    completed: bool
    rescheduled_count: int
    
    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# SCHEDULING (HR)
@router.post("/schedule", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: ScheduleCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can schedule")
    
    application = db.query(Application).filter(Application.id == schedule_data.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if schedule_data.scheduled_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Schedule time must be in future")
    
    schedule = Schedule(**schedule_data.dict())
    db.add(schedule)
    
    # Update application status
    if schedule_data.schedule_type == "assessment":
        application.status = ApplicationStatus.ASSESSMENT_SCHEDULED
    else:
        application.status = ApplicationStatus.INTERVIEW_SCHEDULED
    
    # Create notification
    notification = Notification(
        user_id=application.user_id,
        application_id=application.id,
        type=NotificationType.ASSESSMENT_SCHEDULED if schedule_data.schedule_type == "assessment" else NotificationType.INTERVIEW_SCHEDULED,
        title=f"{schedule_data.schedule_type.title()} Scheduled",
        message=f"Your {schedule_data.schedule_type} for {application.job.title} is scheduled on {schedule_data.scheduled_time.strftime('%B %d, %Y at %I:%M %p')}"
    )
    db.add(notification)
    db.commit()
    db.refresh(schedule)
    
    # Send email
    candidate_email = application.user.email
    candidate_name = application.user.name
    job_title = application.job.title
    
    if schedule_data.schedule_type == "assessment":
        background_tasks.add_task(send_assessment_scheduled, candidate_email, candidate_name, job_title, schedule_data.scheduled_time)
    else:
        background_tasks.add_task(send_interview_scheduled, candidate_email, candidate_name, job_title, schedule_data.scheduled_time)
    
    return schedule

@router.put("/schedule/{schedule_id}/reschedule", response_model=ScheduleResponse)
async def reschedule(
    schedule_id: int,
    new_time: datetime,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    application = schedule.application
    
    # Check authorization
    is_hr = current_user.is_employer and application.job.created_by == current_user.id
    is_candidate = not current_user.is_employer and application.user_id == current_user.id
    
    if not (is_hr or is_candidate):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if schedule.rescheduled_count >= 2:
        raise HTTPException(status_code=400, detail="Maximum reschedule limit reached")
    
    if new_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Time must be in future")
    
    schedule.scheduled_time = new_time
    schedule.rescheduled_count += 1
    schedule.reminder_sent = False
    
    notification = Notification(
        user_id=application.user_id,
        application_id=application.id,
        type=NotificationType.GENERAL,
        title=f"{schedule.schedule_type.title()} Rescheduled",
        message=f"Your {schedule.schedule_type} has been rescheduled to {new_time.strftime('%B %d, %Y at %I:%M %p')}"
    )
    db.add(notification)
    db.commit()
    db.refresh(schedule)
    
    return schedule

@router.get("/my-schedules", response_model=List[ScheduleResponse])
def get_my_schedules(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only candidates can view schedules")
    
    applications = db.query(Application).filter(Application.user_id == current_user.id).all()
    app_ids = [app.id for app in applications]
    
    schedules = db.query(Schedule).filter(
        Schedule.application_id.in_(app_ids),
        Schedule.completed == False
    ).order_by(Schedule.scheduled_time).all()
    
    return schedules

# NOTIFICATIONS
@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return notifications

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Marked as read"}

@router.put("/notifications/mark-all-read")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {"message": "All notifications marked as read"}

@router.get("/notifications/unread-count")
def get_unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}

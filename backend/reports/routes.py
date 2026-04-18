from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from applications.models import Application
from authentication.database import get_db
from authentication.models import User
from authentication.utils import get_current_user
from reports.models import CandidateReport
from reports.schemas import CandidateReportGenerateResponse, CandidateReportResponse
from reports.service import build_report_response_payload, generate_candidate_report

router = APIRouter(prefix="/v1/reports", tags=["Reports"])


def _assert_hr_access(report: CandidateReport, current_user: User) -> None:
    if not current_user.is_employer:
        raise HTTPException(status_code=403, detail="Only HR can access reports")
    if not report.application or not report.application.job or report.application.job.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")


def _assert_owner_or_hr(report: CandidateReport, current_user: User) -> None:
    """Allow the candidate who owns the application OR the HR who owns the job."""
    if current_user.is_employer:
        if not report.application or not report.application.job or report.application.job.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    else:
        # Candidate: verify they own this application
        if not report.application or report.application.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view your own reports")


@router.get("/application/{application_id}", response_model=CandidateReportResponse)
def get_report_for_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(CandidateReport).filter(CandidateReport.application_id == application_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    _assert_hr_access(report, current_user)
    return build_report_response_payload(db, report)


# ── Candidate-facing endpoint ──────────────────────────────────────────────────
@router.get("/my/application/{application_id}", response_model=CandidateReportResponse)
def get_my_report(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Candidate views their own evaluation report for an application."""
    if current_user.is_employer:
        raise HTTPException(status_code=403, detail="Use the HR report endpoint instead")
    report = db.query(CandidateReport).filter(CandidateReport.application_id == application_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not yet generated for this application")
    if not report.application or report.application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own reports")
    return build_report_response_payload(db, report)


@router.post("/application/{application_id}/generate", response_model=CandidateReportGenerateResponse)
async def generate_report_for_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a report — callable by HR (any job they own) or the candidate (their own application)."""
    if current_user.is_employer:
        # HR flow: generate and verify ownership
        report = generate_candidate_report(db, application_id)
        _assert_hr_access(report, current_user)
    else:
        # Candidate flow: verify they own this application first
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        if app.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only generate reports for your own applications")
        report = generate_candidate_report(db, application_id)

    return {
        "message": "Report generated",
        "application_id": application_id,
        "status": report.status,
    }


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(CandidateReport).filter(CandidateReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    _assert_owner_or_hr(report, current_user)
    if not report.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not available")
    return FileResponse(report.pdf_path, media_type="application/pdf", filename=f"candidate_report_{report.application_id}.pdf")

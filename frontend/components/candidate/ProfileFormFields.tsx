"use client";

import { Plus, Trash2, Briefcase, GraduationCap, Code, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useProfileState } from '@/hooks/useProfileState';

interface ProfileFormFieldsProps {
  profileState: ReturnType<typeof useProfileState>;
}

export default function ProfileFormFields({ profileState }: ProfileFormFieldsProps) {
  const { profileState: state } = profileState;
  
  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
            <span className="text-[#B8915C]">👤</span>
          </div>
          Personal Information
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={state.personalInfo.name}
              onChange={(e) => profileState.updatePersonalInfo({ name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={state.personalInfo.email}
              onChange={(e) => profileState.updatePersonalInfo({ email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={state.personalInfo.phone}
              onChange={(e) => profileState.updatePersonalInfo({ phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={state.personalInfo.location}
              onChange={(e) => profileState.updatePersonalInfo({ location: e.target.value })}
              placeholder="San Francisco, CA"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn URL *</Label>
          <Input
            id="linkedin"
            type="url"
            value={state.personalInfo.linkedinUrl}
            onChange={(e) => profileState.updatePersonalInfo({ linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={state.personalInfo.bio}
            onChange={(e) => profileState.updatePersonalInfo({ bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={4}
          />
        </div>
      </section>
      
      {/* Skills */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
            <Code className="w-4 h-4 text-[#B8915C]" />
          </div>
          Skills
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="languages">Programming Languages</Label>
            <Input
              id="languages"
              value={state.skills.languages}
              onChange={(e) => profileState.updateSkills({ languages: e.target.value })}
              placeholder="Python, JavaScript, Java"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="backend">Backend Technologies</Label>
            <Input
              id="backend"
              value={state.skills.backendTechnologies}
              onChange={(e) => profileState.updateSkills({ backendTechnologies: e.target.value })}
              placeholder="FastAPI, Django, Node.js"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="databases">Databases</Label>
            <Input
              id="databases"
              value={state.skills.databases}
              onChange={(e) => profileState.updateSkills({ databases: e.target.value })}
              placeholder="PostgreSQL, MongoDB, Redis"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aiml">AI/ML Frameworks</Label>
            <Input
              id="aiml"
              value={state.skills.aiMlFrameworks}
              onChange={(e) => profileState.updateSkills({ aiMlFrameworks: e.target.value })}
              placeholder="TensorFlow, PyTorch, Scikit-learn"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tools">Tools & Platforms</Label>
            <Input
              id="tools"
              value={state.skills.toolsPlatforms}
              onChange={(e) => profileState.updateSkills({ toolsPlatforms: e.target.value })}
              placeholder="Docker, AWS, Git, Kubernetes"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="competencies">Core Competencies</Label>
            <Input
              id="competencies"
              value={state.skills.coreCompetencies}
              onChange={(e) => profileState.updateSkills({ coreCompetencies: e.target.value })}
              placeholder="System Design, API Development"
            />
          </div>
        </div>
      </section>
      
      {/* Experience */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-[#B8915C]" />
            </div>
            Work Experience
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => profileState.addExperience({
              companyName: '',
              jobTitle: '',
              location: '',
              startDate: '',
              endDate: '',
              isCurrent: false,
              description: '',
            })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
        
        {state.experiences.length === 0 ? (
          <Card className="p-6 text-center text-slate-500">
            No experience added yet. Click "Add Experience" to get started.
          </Card>
        ) : (
          <div className="space-y-4">
            {state.experiences.map((exp) => (
              <Card key={exp.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">Experience Entry</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => profileState.removeExperience(exp.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={exp.jobTitle}
                      onChange={(e) => profileState.updateExperience(exp.id, { jobTitle: e.target.value })}
                      placeholder="Software Engineer"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={exp.companyName}
                      onChange={(e) => profileState.updateExperience(exp.id, { companyName: e.target.value })}
                      placeholder="Tech Corp"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={exp.location}
                      onChange={(e) => profileState.updateExperience(exp.id, { location: e.target.value })}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={exp.startDate}
                      onChange={(e) => profileState.updateExperience(exp.id, { startDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={exp.endDate}
                      onChange={(e) => profileState.updateExperience(exp.id, { endDate: e.target.value })}
                      disabled={exp.isCurrent}
                    />
                  </div>
                  
                  <div className="space-y-2 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.isCurrent}
                        onChange={(e) => profileState.updateExperience(exp.id, { isCurrent: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Currently working here</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => profileState.updateExperience(exp.id, { description: e.target.value })}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Education */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#B8915C]" />
            </div>
            Education
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => profileState.addEducation({
              institution: '',
              degree: '',
              fieldOfStudy: '',
              startDate: '',
              endDate: '',
              grade: '',
              location: '',
            })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </div>
        
        {state.education.length === 0 ? (
          <Card className="p-6 text-center text-slate-500">
            No education added yet. Click "Add Education" to get started.
          </Card>
        ) : (
          <div className="space-y-4">
            {state.education.map((edu) => (
              <Card key={edu.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">Education Entry</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => profileState.removeEducation(edu.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => profileState.updateEducation(edu.id, { institution: e.target.value })}
                      placeholder="University Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => profileState.updateEducation(edu.id, { degree: e.target.value })}
                      placeholder="Bachelor of Science"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      value={edu.fieldOfStudy}
                      onChange={(e) => profileState.updateEducation(edu.id, { fieldOfStudy: e.target.value })}
                      placeholder="Computer Science"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Grade/GPA</Label>
                    <Input
                      value={edu.grade}
                      onChange={(e) => profileState.updateEducation(edu.id, { grade: e.target.value })}
                      placeholder="3.8/4.0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={edu.startDate}
                      onChange={(e) => profileState.updateEducation(edu.id, { startDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={edu.endDate}
                      onChange={(e) => profileState.updateEducation(edu.id, { endDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Location</Label>
                    <Input
                      value={edu.location}
                      onChange={(e) => profileState.updateEducation(edu.id, { location: e.target.value })}
                      placeholder="City, State"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
              <Code className="w-4 h-4 text-[#B8915C]" />
            </div>
            Projects
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => profileState.addProject({
              projectName: '',
              description: '',
              githubUrl: '',
            })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
        
        {state.projects.length === 0 ? (
          <Card className="p-6 text-center text-slate-500">
            No projects added yet. Click "Add Project" to get started.
          </Card>
        ) : (
          <div className="space-y-4">
            {state.projects.map((proj) => (
              <Card key={proj.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">Project Entry</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => profileState.removeProject(proj.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={proj.projectName}
                      onChange={(e) => profileState.updateProject(proj.id, { projectName: e.target.value })}
                      placeholder="My Awesome Project"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={proj.description}
                      onChange={(e) => profileState.updateProject(proj.id, { description: e.target.value })}
                      placeholder="Describe your project..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>GitHub URL</Label>
                    <Input
                      type="url"
                      value={proj.githubUrl}
                      onChange={(e) => profileState.updateProject(proj.id, { githubUrl: e.target.value })}
                      placeholder="https://github.com/username/project"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Certifications */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#B8915C]" />
            </div>
            Certifications
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => profileState.addCertification({ title: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>
        
        {state.certifications.length === 0 ? (
          <Card className="p-6 text-center text-slate-500">
            No certifications added yet. Click "Add Certification" to get started.
          </Card>
        ) : (
          <div className="space-y-3">
            {state.certifications.map((cert) => (
              <Card key={cert.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Input
                    value={cert.title}
                    onChange={(e) => profileState.updateCertification(cert.id, { title: e.target.value })}
                    placeholder="Certification Name"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => profileState.removeCertification(cert.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

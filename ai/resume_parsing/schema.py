from typing import List, Optional 
from pydantic import BaseModel, Field

class Experience(BaseModel):
    role: str
    organization: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = Field(
        None, description="YYYY-MM or YYYY"
    )
    end_date: Optional[str] = Field(
        None, description="YYYY-MM, YYYY, or 'Present'"
    )
    description: List[str] = []

class Project(BaseModel):
    name: str
    technologies: List[str] = []
    description: List[str] = []
    start_date: Optional[str] = Field(
        None, description="YYYY-MM or YYYY"
    )
    end_date: Optional[str] = Field(
        None, description="YYYY-MM, YYYY, or 'Present'"
    )

class Achievement(BaseModel):
    title: str
    organization: Optional[str] = None
    start_date: Optional[str] = Field(
        None, description="YYYY-MM or YYYY"
    )
    end_date: Optional[str] = Field(
        None, description="YYYY-MM, YYYY, or 'Present'"
    )
    description: List[str] = []

class Education(BaseModel):
    degree: Optional[str] = None
    institution: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

# class Skill(BaseModel):
#     name: str

class ExtraSection(BaseModel):
    title: str
    items: List[str] = []

class ResumeSchema(BaseModel):
    skills: List[str] = []
    experiences: List[Experience] = []
    projects: List[Project] = []
    education: List[Education] = []
    achievements: List[Achievement] = [] 
    extra_sections: List[ExtraSection] = []
#!/usr/bin/env python3
"""
Concrete scoring algorithms based on real data analysis
"""

import math
from typing import List, Dict, Any
from schemas.candidate import CandidateProfile, Project

class ConcreteScoringEngine:
    """Concrete scoring engine that analyzes real data"""
    
    def __init__(self):
        self.scoring_factors = {}
    
    def calculate_github_innovation_score(self, projects: List[Project]) -> Dict[str, Any]:
        """Calculate innovation score based on concrete GitHub metrics"""
        if not projects:
            return {"score": 0.0, "factors": [], "explanation": "No projects found"}
        
        factors = []
        total_score = 0.0
        
        # Factor 1: Total Stars (Community Recognition)
        total_stars = sum(p.stars or 0 for p in projects)
        star_score = min(100, (total_stars / 1000) * 20)  # Max 20 points for stars
        factors.append({
            "name": "Community Recognition",
            "value": total_stars,
            "score": star_score,
            "explanation": f"{total_stars:,} total stars across {len(projects)} repositories"
        })
        total_score += star_score
        
        # Factor 2: Repository Quality (Stars per repo)
        avg_stars_per_repo = total_stars / len(projects)
        quality_score = min(25, avg_stars_per_repo / 10)  # Max 25 points
        factors.append({
            "name": "Repository Quality",
            "value": f"{avg_stars_per_repo:.1f}",
            "score": quality_score,
            "explanation": f"Average {avg_stars_per_repo:.1f} stars per repository"
        })
        total_score += quality_score
        
        # Factor 3: Technology Diversity
        technologies = set()
        for p in projects:
            if p.technologies:
                technologies.update(p.technologies)
        diversity_score = min(15, len(technologies) * 3)  # Max 15 points
        factors.append({
            "name": "Technology Diversity",
            "value": len(technologies),
            "score": diversity_score,
            "explanation": f"Uses {len(technologies)} different technologies: {', '.join(technologies)}"
        })
        total_score += diversity_score
        
        # Factor 4: Recent Activity (based on start_date)
        recent_projects = []
        for p in projects:
            if p.start_date and p.start_date.year >= 2023:
                recent_projects.append(p)
        activity_score = min(20, len(recent_projects) * 5)  # Max 20 points
        factors.append({
            "name": "Recent Activity",
            "value": len(recent_projects),
            "score": activity_score,
            "explanation": f"{len(recent_projects)} repositories started in 2023-2024"
        })
        total_score += activity_score
        
        # Factor 5: Fork Impact (Community Contribution)
        total_forks = sum(p.forks or 0 for p in projects)
        fork_score = min(20, (total_forks / 100) * 10)  # Max 20 points
        factors.append({
            "name": "Community Contribution",
            "value": total_forks,
            "score": fork_score,
            "explanation": f"{total_forks:,} total forks (community contributions)"
        })
        total_score += fork_score
        
        return {
            "score": min(100, total_score),
            "factors": factors,
            "explanation": f"Innovation score based on {len(factors)} concrete metrics from GitHub data"
        }
    
    def calculate_github_velocity_score(self, projects: List[Project]) -> Dict[str, Any]:
        """Calculate velocity score based on concrete GitHub activity"""
        if not projects:
            return {"score": 0.0, "factors": [], "explanation": "No projects found"}
        
        factors = []
        total_score = 0.0
        
        # Factor 1: Project Creation Rate
        creation_years = {}
        for p in projects:
            if p.start_date:
                year = str(p.start_date.year)
                creation_years[year] = creation_years.get(year, 0) + 1
        
        recent_creations = sum(count for year, count in creation_years.items() 
                             if year in ["2023", "2024", "2025"])
        creation_score = min(30, recent_creations * 10)  # Max 30 points
        factors.append({
            "name": "Project Creation Rate",
            "value": recent_creations,
            "score": creation_score,
            "explanation": f"Started {recent_creations} projects in recent years"
        })
        total_score += creation_score
        
        # Factor 2: Repository Size (Lines of code proxy)
        # Estimate based on stars (more stars = more substantial projects)
        substantial_projects = len([p for p in projects if (p.stars or 0) > 10])
        size_score = min(25, substantial_projects * 5)  # Max 25 points
        factors.append({
            "name": "Substantial Projects",
            "value": substantial_projects,
            "score": size_score,
            "explanation": f"{substantial_projects} repositories with 10+ stars (substantial projects)"
        })
        total_score += size_score
        
        # Factor 3: Technology Adoption (Modern technologies)
        modern_technologies = {"Python", "JavaScript", "TypeScript", "React", "Node.js", "Docker", "Kubernetes"}
        modern_projects = 0
        for p in projects:
            if p.technologies:
                if any(tech in modern_technologies for tech in p.technologies):
                    modern_projects += 1
        adoption_score = min(25, modern_projects * 5)  # Max 25 points
        factors.append({
            "name": "Modern Technology Adoption",
            "value": modern_projects,
            "score": adoption_score,
            "explanation": f"{modern_projects} projects using modern technologies"
        })
        total_score += adoption_score
        
        # Factor 4: Community Engagement
        engagement_projects = len([p for p in projects if (p.forks or 0) > 0])
        engagement_score = min(20, engagement_projects * 4)  # Max 20 points
        factors.append({
            "name": "Community Engagement",
            "value": engagement_projects,
            "score": engagement_score,
            "explanation": f"{engagement_projects} repositories with community forks"
        })
        total_score += engagement_score
        
        return {
            "score": min(100, total_score),
            "factors": factors,
            "explanation": f"Velocity score based on {len(factors)} concrete development metrics"
        }
    
    def calculate_github_selectivity_score(self, projects: List[Project]) -> Dict[str, Any]:
        """Calculate selectivity score based on concrete quality metrics"""
        if not projects:
            return {"score": 0.0, "factors": [], "explanation": "No projects found"}
        
        factors = []
        total_score = 0.0
        
        # Factor 1: High-Quality Projects (50+ stars)
        high_quality = len([p for p in projects if (p.stars or 0) >= 50])
        quality_score = min(40, high_quality * 10)  # Max 40 points
        factors.append({
            "name": "High-Quality Projects",
            "value": high_quality,
            "score": quality_score,
            "explanation": f"{high_quality} repositories with 50+ stars (high quality)"
        })
        total_score += quality_score
        
        # Factor 2: Project Focus (not too many, not too few)
        project_count = len(projects)
        if 3 <= project_count <= 15:  # Sweet spot
            focus_score = 30
            focus_explanation = f"{project_count} repositories (optimal focus)"
        elif project_count < 3:
            focus_score = project_count * 10
            focus_explanation = f"{project_count} repositories (limited scope)"
        else:
            focus_score = max(10, 30 - (project_count - 15) * 2)
            focus_explanation = f"{project_count} repositories (very broad scope)"
        
        factors.append({
            "name": "Project Focus",
            "value": project_count,
            "score": focus_score,
            "explanation": focus_explanation
        })
        total_score += focus_score
        
        # Factor 3: Consistency (projects with descriptions)
        described_projects = len([p for p in projects if p.description and len(p.description) > 10])
        consistency_score = min(30, (described_projects / len(projects)) * 30)  # Max 30 points
        factors.append({
            "name": "Project Documentation",
            "value": f"{described_projects}/{len(projects)}",
            "score": consistency_score,
            "explanation": f"{described_projects}/{len(projects)} repositories have detailed descriptions"
        })
        total_score += consistency_score
        
        return {
            "score": min(100, total_score),
            "factors": factors,
            "explanation": f"Selectivity score based on {len(factors)} concrete quality metrics"
        }
    
    def generate_concrete_report(self, profile: CandidateProfile) -> Dict[str, Any]:
        """Generate a concrete, data-driven report"""
        projects = profile.projects or []
        
        innovation = self.calculate_github_innovation_score(projects)
        velocity = self.calculate_github_velocity_score(projects)
        selectivity = self.calculate_github_selectivity_score(projects)
        
        # Calculate overall score
        overall_score = (innovation["score"] * 0.4 + velocity["score"] * 0.3 + selectivity["score"] * 0.3)
        
        return {
            "overall_score": round(overall_score, 2),
            "innovation": innovation,
            "velocity": velocity,
            "selectivity": selectivity,
            "summary": {
                "total_repositories": len(projects),
                "total_stars": sum(p.stars or 0 for p in projects),
                "total_forks": sum(p.forks or 0 for p in projects),
                "programming_languages": len(set(tech for p in projects if p.technologies for tech in p.technologies)),
                "data_sources": ["github"],
                "confidence": "high" if len(projects) >= 3 else "medium"
            }
        }

# Test the concrete scoring
if __name__ == "__main__":
    # This would be used to test with real data
    pass

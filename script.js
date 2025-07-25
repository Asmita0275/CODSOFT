// script.js

document.addEventListener('DOMContentLoaded', function () {
  // Utility: Fetch jobs from jobs.json and merge with localStorage jobs
  async function fetchJobs() {
    let jobs = [];
    try {
      const res = await fetch('data/jobs.json');
      jobs = await res.json();
    } catch (e) {
      console.error('Failed to fetch jobs.json', e);
    }
    // Merge with jobs from localStorage (employer posted jobs)
    const localJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
    // Assign unique IDs to local jobs if missing
    localJobs.forEach((job, idx) => {
      if (!job.id) job.id = 1000 + idx;
    });
    return [...jobs, ...localJobs];
  }

  // 1. Home Page: Render featured jobs
  if (document.querySelector('.featured-jobs')) {
    fetchJobs().then(jobs => {
      const featured = jobs.slice(0, 3); // First 3 jobs
      const container = document.getElementById('featured-jobs-list');
      if (!container) return;
      container.innerHTML = featured.map(job => jobCardHTML(job, true)).join('');
      addJobCardListeners();
    });
  }

  // 2. Jobs Page: Render all jobs and search/filter
  if (document.getElementById('jobs-list')) {
    let allJobs = [];
    let filteredJobs = [];
    const jobsList = document.getElementById('jobs-list');
    const searchTitle = document.getElementById('search-title');
    const searchLocation = document.getElementById('search-location');
    const searchType = document.getElementById('search-type');
    const searchBtn = document.getElementById('search-btn');

    fetchJobs().then(jobs => {
      allJobs = jobs;
      filteredJobs = jobs;
      renderJobs(filteredJobs);
    });

    function renderJobs(jobs) {
      if (!jobsList) return;
      if (jobs.length === 0) {
        jobsList.innerHTML = '<p>No jobs found.</p>';
        return;
      }
      jobsList.innerHTML = jobs.map(job => jobCardHTML(job)).join('');
      addJobCardListeners();
    }

    function filterJobs() {
      const title = searchTitle.value.trim().toLowerCase();
      const location = searchLocation.value.trim().toLowerCase();
      const type = searchType.value;
      filteredJobs = allJobs.filter(job => {
        const matchTitle = job.title.toLowerCase().includes(title);
        const matchLocation = job.location.toLowerCase().includes(location);
        const matchType = !type || job.type === type;
        return matchTitle && matchLocation && matchType;
      });
      renderJobs(filteredJobs);
    }

    if (searchBtn) searchBtn.addEventListener('click', filterJobs);
    if (searchTitle) searchTitle.addEventListener('keyup', function(e) { if (e.key === 'Enter') filterJobs(); });
    if (searchLocation) searchLocation.addEventListener('keyup', function(e) { if (e.key === 'Enter') filterJobs(); });
    if (searchType) searchType.addEventListener('change', filterJobs);
  }

  // 3. Job Details Page: Render job details and handle application
  if (document.getElementById('job-detail-section')) {
    const jobDetailSection = document.getElementById('job-detail-section');
    const applicationFormSection = document.getElementById('application-form-section');
    const applyForm = document.getElementById('apply-form');
    const applicationSuccess = document.getElementById('application-success');

    // Get selected job ID from localStorage
    const selectedJobId = localStorage.getItem('selectedJobId');
    if (!selectedJobId) {
      jobDetailSection.innerHTML = '<p>No job selected.</p>';
      if (applicationFormSection) applicationFormSection.style.display = 'none';
      return;
    }

    fetchJobs().then(jobs => {
      const job = jobs.find(j => String(j.id) === String(selectedJobId));
      if (!job) {
        jobDetailSection.innerHTML = '<p>Job not found.</p>';
        if (applicationFormSection) applicationFormSection.style.display = 'none';
        return;
      }
      // Render job details
      jobDetailSection.innerHTML = `
        <h2>${job.title}</h2>
        <p><strong>${job.company}</strong> &middot; ${job.location} &middot; <span class="job-type">${job.type}</span></p>
        <h3>Description</h3>
        <p>${job.description}</p>
        <h3>Qualifications</h3>
        <p>${job.qualifications}</p>
        <h3>How to Apply</h3>
        <p>${job.howToApply}</p>
        <button id="show-apply-form-btn">Apply</button>
      `;
      // Show application form on button click
      const showApplyBtn = document.getElementById('show-apply-form-btn');
      if (showApplyBtn && applicationFormSection) {
        showApplyBtn.addEventListener('click', function() {
          applicationFormSection.style.display = 'block';
          showApplyBtn.style.display = 'none';
        });
      }
    });

    // Handle application form submission
    if (applyForm) {
      applyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('applicant-name').value.trim();
        const email = document.getElementById('applicant-email').value.trim();
        // For resume, just store filename as placeholder
        const resumeInput = document.getElementById('applicant-resume');
        const resume = resumeInput && resumeInput.files.length > 0 ? resumeInput.files[0].name : '';
        // Save application to localStorage
        const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
        appliedJobs.push({
          jobId: selectedJobId,
          name,
          email,
          resume,
          appliedAt: new Date().toISOString()
        });
        localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
        // Show confirmation
        if (applicationSuccess) applicationSuccess.style.display = 'block';
        applyForm.reset();
        setTimeout(() => {
          if (applicationSuccess) applicationSuccess.style.display = 'none';
          if (applicationFormSection) applicationFormSection.style.display = 'none';
          // Optionally, show the apply button again
          const showApplyBtn = document.getElementById('show-apply-form-btn');
          if (showApplyBtn) showApplyBtn.style.display = 'inline-block';
        }, 2000);
      });
    }
  }

  // 4. Dashboard Page: Employer and Candidate logic
  if (document.getElementById('employer-dashboard') && document.getElementById('candidate-dashboard')) {
    const employerTab = document.getElementById('employer-tab');
    const candidateTab = document.getElementById('candidate-tab');
    const employerDashboard = document.getElementById('employer-dashboard');
    const candidateDashboard = document.getElementById('candidate-dashboard');
    const addJobForm = document.getElementById('add-job-form');
    const postedJobsList = document.getElementById('posted-jobs-list');
    const appliedJobsList = document.getElementById('applied-jobs-list');

    // Tab switching
    if (employerTab && candidateTab && employerDashboard && candidateDashboard) {
      employerTab.addEventListener('click', function() {
        employerTab.classList.add('active');
        candidateTab.classList.remove('active');
        employerDashboard.style.display = 'block';
        candidateDashboard.style.display = 'none';
      });
      candidateTab.addEventListener('click', function() {
        candidateTab.classList.add('active');
        employerTab.classList.remove('active');
        candidateDashboard.style.display = 'block';
        employerDashboard.style.display = 'none';
      });
    }

    // Employer: Add new job
    if (addJobForm) {
      addJobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('job-title').value.trim();
        const company = document.getElementById('job-company').value.trim();
        const location = document.getElementById('job-location').value.trim();
        const type = document.getElementById('job-type').value;
        const description = document.getElementById('job-description').value.trim();
        const qualifications = document.getElementById('job-qualifications').value.trim();
        const howToApply = document.getElementById('job-how-to-apply').value.trim();
        // Get posted jobs from localStorage
        const postedJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
        // Assign a unique ID
        const newId = Date.now();
        postedJobs.push({
          id: newId,
          title,
          company,
          location,
          type,
          description,
          qualifications,
          howToApply
        });
        localStorage.setItem('postedJobs', JSON.stringify(postedJobs));
        addJobForm.reset();
        renderPostedJobs();
      });
    }

    // Employer: Render posted jobs
    function renderPostedJobs() {
      const postedJobs = JSON.parse(localStorage.getItem('postedJobs') || '[]');
      if (!postedJobsList) return;
      if (postedJobs.length === 0) {
        postedJobsList.innerHTML = '<p>No jobs posted yet.</p>';
        return;
      }
      postedJobsList.innerHTML = postedJobs.map(job => `
        <div class="job-card">
          <h4>${job.title}</h4>
          <p><strong>${job.company}</strong></p>
          <p>${job.location} &middot; <span class="job-type">${job.type}</span></p>
        </div>
      `).join('');
    }
    renderPostedJobs();

    // Candidate: Render applied jobs
    function renderAppliedJobs() {
      const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
      if (!appliedJobsList) return;
      if (appliedJobs.length === 0) {
        appliedJobsList.innerHTML = '<p>No jobs applied yet.</p>';
        return;
      }
      // Fetch all jobs to get job details
      fetchJobs().then(jobs => {
        appliedJobsList.innerHTML = appliedJobs.map(app => {
          const job = jobs.find(j => String(j.id) === String(app.jobId));
          return job ? `
            <div class="job-card">
              <h4>${job.title}</h4>
              <p><strong>${job.company}</strong></p>
              <p>${job.location} &middot; <span class="job-type">${job.type}</span></p>
              <p><em>Applied on: ${new Date(app.appliedAt).toLocaleDateString()}</em></p>
            </div>
          ` : '';
        }).join('');
      });
    }
    renderAppliedJobs();
  }

  // Helper: Generate job card HTML
  function jobCardHTML(job, isFeatured = false) {
    return `
      <div class="job-card${isFeatured ? ' featured' : ''}" data-id="${job.id}">
        <h3>${job.title}</h3>
        <p><strong>${job.company}</strong></p>
        <p>${job.location} &middot; <span class="job-type">${job.type}</span></p>
        <button class="view-job-btn" data-id="${job.id}">View Details</button>
      </div>
    `;
  }

  // Helper: Add listeners to job cards for navigation
  function addJobCardListeners() {
    document.querySelectorAll('.view-job-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const jobId = this.getAttribute('data-id');
        // Store jobId in localStorage for job-details.html
        localStorage.setItem('selectedJobId', jobId);
        window.location.href = 'job-details.html';
      });
    });
  }

  // (Other logic for job-details, dashboard, etc. will be added later)
}); 
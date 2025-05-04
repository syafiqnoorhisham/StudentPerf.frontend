// Configuration
// Try both API URLs until one works
const API_URLS = [
    'https://localhost:7119/api/performance',
    'http://localhost:5162/api/performance'
];
let API_BASE_URL = API_URLS[0];

// State Management
let state = {
    search: '',
    course: '',
    subject: '',
    page: 1,
    pageSize: 10,
    sortBy: 'StudentName',
    sortDirection: 'asc',
    totalItems: 0,
    totalPages: 0,
    courses: [],
    subjects: []
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    courseFilter: document.getElementById('courseFilter'),
    subjectFilter: document.getElementById('subjectFilter'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorAlert: document.getElementById('errorAlert'),
    errorMessage: document.getElementById('errorMessage'),
    resultsBody: document.getElementById('resultsBody'),
    noResultsMessage: document.getElementById('noResultsMessage'),
    pagination: document.getElementById('pagination'),
    pageSizeSelect: document.getElementById('pageSizeSelect'),
    currentPageStart: document.getElementById('currentPageStart'),
    currentPageEnd: document.getElementById('currentPageEnd'),
    totalItems: document.getElementById('totalItems')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

elements.searchInput.addEventListener('input', debounce(handleSearchInput, 500));
elements.courseFilter.addEventListener('change', handleCourseChange);
elements.subjectFilter.addEventListener('change', handleSubjectChange);
elements.pageSizeSelect.addEventListener('change', handlePageSizeChange);

document.querySelectorAll('th[data-sort]').forEach(header => {
    header.addEventListener('click', () => handleSortChange(header.dataset.sort));
});

// Function to try each API URL until one works
async function tryApiUrls() {
    for (const url of API_URLS) {
        try {
            console.log(`Attempting to connect to API at: ${url}`);
            const response = await fetch(`${url}?pageSize=1`, { 
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            console.log(`Response status for ${url}: ${response.status}`);
            
            if (response.ok) {
                API_BASE_URL = url;
                console.log(`Successfully connected to API at: ${url}`);
                return true;
            }
        } catch (error) {
            console.warn(`Failed to connect to API at: ${url}`, error);
        }
    }
    
    // If we get here, none of the URLs worked
    return false;
}

// App Initialization
async function initializeApp() {
    showLoading();
    
    try {
        // First try to find a working API endpoint
        const apiConnected = await tryApiUrls();
        
        if (!apiConnected) {
            throw new Error('Unable to connect to any API endpoint');
        }
        
        // Fetch initial data and populate filters
        await populateFilters();
        await fetchPerformanceData();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Failed to initialize the application. Please ensure the API is running at ' + API_BASE_URL);
        console.error('Initialization error:', error);
    }
}

// API Functions
async function fetchPerformanceData() {
    showLoading();
    
    try {
        const queryParams = new URLSearchParams();
        
        // Only add search if it has 3 or more characters
        if (state.search && state.search.length >= 3) {
            queryParams.append('search', state.search);
        }
        
        if (state.course) {
            queryParams.append('courseId', state.course);
        }
        
        if (state.subject) {
            queryParams.append('subjectId', state.subject);
        }
        
        queryParams.append('page', state.page);
        queryParams.append('pageSize', state.pageSize);
        queryParams.append('sortBy', state.sortBy);
        queryParams.append('sortDirection', state.sortDirection);
        
        console.log(`Fetching data from: ${API_BASE_URL}?${queryParams.toString()}`);
        
        const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        // Update state
        state.totalItems = data.pagination.totalItems;
        state.totalPages = data.pagination.totalPages;
        
        // Render data
        renderTable(data.data);
        renderPagination();
        updatePaginationInfo();
        
        hideLoading();
        hideError();
        
        // Show no results message if needed
        if (data.data.length === 0) {
            showNoResults();
        } else {
            hideNoResults();
        }
    } catch (error) {
        hideLoading();
        showError('Failed to fetch performance data. Please try again later.');
        console.error('API error:', error);
    }
}

async function populateFilters() {
    try {
        // Get unique courses and subjects from the API
        const response = await fetch(`${API_BASE_URL}?pageSize=100`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Maps to track courseId -> courseName and subjectId -> subjectName
        const courseMap = new Map();
        const subjectMap = new Map();
        
        // First pass: try to extract courseId and subjectId from the raw data
        if (data.data && data.data.length > 0) {
            data.data.forEach(item => {
                // Extract the numeric IDs if they're available in the response
                if (item.course_id !== undefined) {
                    courseMap.set(item.course_name, { id: item.course_id, name: item.course_name });
                }
                
                if (item.subject_id !== undefined) {
                    subjectMap.set(item.subject_name, { id: item.subject_id, name: item.subject_name });
                }
            });
        }
        
        // If we couldn't find IDs in the response, create numeric IDs for courses and subjects
        if (courseMap.size === 0) {
            console.log('No direct course IDs found in response, creating synthetic IDs');
            
            // Get unique course names - try both field formats (old and new)
            const uniqueCourses = [...new Set(data.data.map(item => 
                item.course_name || item.course))];
            
            // Create synthetic numeric IDs for courses
            uniqueCourses.sort().forEach((name, index) => {
                courseMap.set(name, { id: index + 1, name });
            });
        }
        
        if (subjectMap.size === 0) {
            console.log('No direct subject IDs found in response, creating synthetic IDs');
            
            // Get unique subject names - try both field formats (old and new)
            const uniqueSubjects = [...new Set(data.data.map(item => 
                item.subject_name || item.subject))];
            
            // Create synthetic numeric IDs for subjects
            uniqueSubjects.sort().forEach((name, index) => {
                subjectMap.set(name, { id: index + 1, name });
            });
        }
        
        // Convert maps to arrays
        state.courses = Array.from(courseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        state.subjects = Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        
        // Populate dropdowns
        populateCourseDropdown();
        populateSubjectDropdown();
    } catch (error) {
        console.error('Failed to populate filters:', error);
        showError('Failed to load filter options. Some features may be limited.');
    }
}

// Render Functions
function renderTable(data) {
    elements.resultsBody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Format dates for display
        const submittedDate = new Date(item.submittedOn).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const modifiedDate = new Date(item.modifiedOn).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td>${item.studentId}</td>
            <td>${item.studentName}</td>
            <td>${item.course_name}</td>
            <td>${item.subject_name}</td>
            <td>${item.grade}</td>
            <td>${submittedDate}</td>
            <td>${modifiedDate}</td>
        `;
        
        elements.resultsBody.appendChild(row);
    });
}

function renderPagination() {
    elements.pagination.innerHTML = '';
    
    // Don't render pagination if only one page
    if (state.totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${state.page === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">&laquo;</a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.page > 1) {
            goToPage(state.page - 1);
        }
    });
    elements.pagination.appendChild(prevLi);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, state.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(state.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === state.page ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(i);
        });
        elements.pagination.appendChild(pageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${state.page === state.totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">&raquo;</a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.page < state.totalPages) {
            goToPage(state.page + 1);
        }
    });
    elements.pagination.appendChild(nextLi);
}

function populateCourseDropdown() {
    // Clear existing options except the first one
    while (elements.courseFilter.options.length > 1) {
        elements.courseFilter.remove(1);
    }
    
    // Add course options
    state.courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id; // Use name as the value
        option.textContent = course.name;
        elements.courseFilter.appendChild(option);
    });
}

function populateSubjectDropdown() {
    // Clear existing options except the first one
    while (elements.subjectFilter.options.length > 1) {
        elements.subjectFilter.remove(1);
    }
    
    // Add subject options
    state.subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id; // Use name as the value
        option.textContent = subject.name;
        elements.subjectFilter.appendChild(option);
    });
}

function updatePaginationInfo() {
    if (state.totalItems === 0) {
        elements.currentPageStart.textContent = '0';
        elements.currentPageEnd.textContent = '0';
        elements.totalItems.textContent = '0';
        return;
    }
    
    const start = (state.page - 1) * state.pageSize + 1;
    const end = Math.min(start + state.pageSize - 1, state.totalItems);
    
    elements.currentPageStart.textContent = start;
    elements.currentPageEnd.textContent = end;
    elements.totalItems.textContent = state.totalItems;
}

// Event Handler Functions
function handleSearchInput() {
    const value = elements.searchInput.value.trim();
    
    // Only search if 3 or more characters
    if (value.length === 0 || value.length >= 3) {
        state.search = value;
        state.page = 1; // Reset to first page
        fetchPerformanceData();
    }
}

function handleCourseChange() {
    // Get the selected value directly (which is now the course name)
    state.course = elements.courseFilter.value;
    state.page = 1; // Reset to first page
    fetchPerformanceData();
}

function handleSubjectChange() {
    // Get the selected value directly (which is now the subject name)
    state.subject = elements.subjectFilter.value;
    state.page = 1; // Reset to first page
    fetchPerformanceData();
}

function handlePageSizeChange() {
    state.pageSize = parseInt(elements.pageSizeSelect.value);
    state.page = 1; // Reset to first page
    fetchPerformanceData();
}

function handleSortChange(sortBy) {
    // Toggle direction if same column, otherwise default to ascending
    if (state.sortBy === sortBy) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortBy = sortBy;
        state.sortDirection = 'asc';
    }
    
    // Update UI to show active sort
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.classList.remove('active', 'asc', 'desc');
        
        if (header.dataset.sort === state.sortBy) {
            header.classList.add('active', state.sortDirection);
        }
    });
    
    fetchPerformanceData();
}

function goToPage(page) {
    state.page = page;
    fetchPerformanceData();
}

// Utility Functions
function showLoading() {
    elements.loadingIndicator.classList.remove('d-none');
}

function hideLoading() {
    elements.loadingIndicator.classList.add('d-none');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorAlert.classList.remove('d-none');
}

function hideError() {
    elements.errorAlert.classList.add('d-none');
}

function showNoResults() {
    elements.noResultsMessage.classList.remove('d-none');
}

function hideNoResults() {
    elements.noResultsMessage.classList.add('d-none');
}

// Debounce function to limit how often a function can run
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

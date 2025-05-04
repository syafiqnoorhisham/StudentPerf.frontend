import axios from 'axios';

// API Configuration
const API_URLS = [
    'https://localhost:7119/api/performance',
    'http://localhost:5162/api/performance',
    'https://studentperf-api-frcyfegwfyc7b0hk.indonesiacentral-01.azurewebsites.net/api/performance'
];

// Create an Axios instance with default config
const api = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});


let activeApiUrl = API_URLS[0];

// Function to try connecting to each API URL until one works
const findWorkingApiUrl = async () => {
    for (const url of API_URLS) {
        try {
            console.log(`Attempting to connect to API at: ${url}`);
            
            // Try to fetch a single item to test connection
            const response = await axios.get(`${url}?pageSize=1`, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.status === 200) {
                console.log(`Successfully connected to API at: ${url}`);
                activeApiUrl = url;
                return true;
            }
        } catch (error) {
            console.warn(`Failed to connect to API at: ${url}`, error);
        }
    }
    
    console.error('Unable to connect to any API endpoint');
    throw new Error('Unable to connect to API');
};

// Get performance data with filters, sorting, and pagination
const getPerformanceData = async (params = {}) => {
    try {
        console.log('Fetching data with params:', params);
        const response = await api.get(activeApiUrl, { params });
        console.log('API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching performance data:', error);
        throw error;
    }
};

// Get the filter data (courses and subjects)
const getFilterData = async () => {
    try {
        // Get a larger dataset to ensure we have all courses and subjects
        const response = await api.get(`${activeApiUrl}?pageSize=100`);
        console.log('Filter data response:', response.data);
        
        // Maps to track courseId -> courseName and subjectId -> subjectName
        const courseMap = new Map();
        const subjectMap = new Map();
        
        // First pass: try to extract courseId and subjectId from the raw data
        if (response.data && response.data.data && response.data.data.length > 0) {
            response.data.data.forEach(item => {
                // Extract the numeric IDs if they're available in the response
                if (item.courseId !== undefined) {
                    courseMap.set(item.course, { id: item.courseId, name: item.course });
                }
                
                if (item.subjectId !== undefined) {
                    subjectMap.set(item.subject, { id: item.subjectId, name: item.subject });
                }
            });
        }
        
        // Convert maps to arrays
        const courses = Array.from(courseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        const subjects = Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Extracted courses:', courses);
        console.log('Extracted subjects:', subjects);
        
        return { 
            courses,
            subjects
        };
    } catch (error) {
        console.error('Error fetching filter data:', error);
        throw error;
    }
};

// Initialize API connection
const initializeApi = async () => {
    await findWorkingApiUrl();
};

export default {
    initializeApi,
    getPerformanceData,
    getFilterData
};

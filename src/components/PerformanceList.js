import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Form, Table, Spinner, Alert, Pagination, Card } from 'react-bootstrap';
import api from '../services/api';

const PerformanceList = () => {
  // State for performance data
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // State for sorting
  const [sortBy, setSortBy] = useState('studentName');
  const [sortDirection, setSortDirection] = useState('asc');

  // Initialize API and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        await api.initializeApi();
        
        // Load proper course and subject data with correct IDs
        const filterData = await api.getFilterData();
        setCourses(filterData.courses);
        setSubjects(filterData.subjects);
        
        // Load initial performance data
        const initialData = await api.getPerformanceData({
          page: 1,
          pageSize: 10,
          sortBy: 'studentName',
          sortDirection: 'asc'
        });
        
        // Set the performance data
        setPerformanceData(initialData.data);
        setTotalItems(initialData.pagination.totalItems);
        setTotalPages(initialData.pagination.totalPages);
      } catch (error) {
        console.error('Error initializing the application:', error);
        setError('Failed to initialize the application. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Fetch performance data when filters, pagination, or sorting changes - memoized with useCallback
  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = {
        page: currentPage,
        pageSize,
        sortBy,
        sortDirection
      };
      
      // Only add search if it has 3 or more characters
      if (search && search.length >= 3) {
        params.search = search;
      }
      
      // Pass the course ID to the API
      if (selectedCourse) {
        params.courseId = selectedCourse;
      }
      
      // Pass the subject ID to the API
      if (selectedSubject) {
        params.subjectId = selectedSubject;
      }
      
      const response = await api.getPerformanceData(params);
      
      setPerformanceData(response.data);
      setTotalItems(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.currentPage);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError('Failed to fetch performance data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, selectedCourse, selectedSubject, search]);
  
  // Re-fetch data when filters, pagination, or sorting changes
  useEffect(() => {
    if (!loading) {
      fetchPerformanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortBy, sortDirection, selectedCourse, selectedSubject, search]);

  // Handle search input with proper debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    
    // Only search if 3 or more characters or empty
    if (value.length === 0 || value.length >= 3) {
      console.log("Search value meets criteria, triggering search:", value);
      
      // Use setTimeout to debounce the API call
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
      
      window.searchTimeout = setTimeout(() => {
        setSearch(value);
        setCurrentPage(1); // Reset to first page
      }, 500); // 500ms debounce
    } else {
      setSearch(value); // Still update the input field value
    }
  };
  
  // Handle course filter change
  const handleCourseChange = (e) => {
    const selectedCourseValue = e.target.value;
    console.log("Selected course ID:", selectedCourseValue);
    
    // Now we're using the proper numeric ID
    setSelectedCourse(selectedCourseValue);
    setCurrentPage(1); // Reset to first page
  };
  
  // Handle subject filter change
  const handleSubjectChange = (e) => {
    const selectedSubjectValue = e.target.value;
    console.log("Selected subject ID:", selectedSubjectValue);
    
    // Now we're using the proper numeric ID
    setSelectedSubject(selectedSubjectValue);
    setCurrentPage(1); // Reset to first page
  };
  
  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort class for header
  const getSortClass = (field) => {
    if (sortBy === field) {
      return `active ${sortDirection === 'desc' ? 'desc' : ''}`;
    }
    return '';
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      />
    );
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Next button
    items.push(
      <Pagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
      />
    );
    
    return items;
  };
  
  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Row className="filters-row">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search (min 3 characters)"
                  value={search}
                  onChange={handleSearchChange}
                />
                <Form.Text className="text-muted">
                  Search across student name, course, and subject
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Course</Form.Label>
                <Form.Select
                  value={selectedCourse}
                  onChange={handleCourseChange}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Subject</Form.Label>
                <Form.Select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="loading-indicator">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {performanceData.length === 0 ? (
                <Alert variant="info">No results found.</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th 
                        className={getSortClass('studentId')}
                        onClick={() => handleSort('studentId')}
                      >
                        Student ID
                      </th>
                      <th 
                        className={getSortClass('studentName')}
                        onClick={() => handleSort('studentName')}
                      >
                        Name
                      </th>
                      <th 
                        className={getSortClass('course')}
                        onClick={() => handleSort('course')}
                      >
                        Course
                      </th>
                      <th 
                        className={getSortClass('subject')}
                        onClick={() => handleSort('subject')}
                      >
                        Subject
                      </th>
                      <th 
                        className={getSortClass('grade')}
                        onClick={() => handleSort('grade')}
                      >
                        Grade
                      </th>
                      <th 
                        className={getSortClass('submittedOn')}
                        onClick={() => handleSort('submittedOn')}
                      >
                        Submitted On
                      </th>
                      <th 
                        className={getSortClass('modifiedOn')}
                        onClick={() => handleSort('modifiedOn')}
                      >
                        Modified On
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map(item => (
                      <tr key={item.id}>
                        <td>{item.studentId}</td>
                        <td>{item.studentName}</td>
                        <td>{item.course_name || item.course}</td>
                        <td>{item.subject_name || item.subject}</td>
                        <td>{item.grade}</td>
                        <td>{formatDate(item.submittedOn)}</td>
                        <td>{formatDate(item.modifiedOn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              
              <Row>
                <Col md={6}>
                  <Form.Group className="d-flex align-items-center">
                    <Form.Label className="me-2 mb-0">Show:</Form.Label>
                    <Form.Select
                      style={{ width: '80px' }}
                      value={pageSize}
                      onChange={handlePageSizeChange}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex justify-content-end">
                  <Pagination>
                    {renderPaginationItems()}
                  </Pagination>
                </Col>
              </Row>
              
              <div className="pagination-info text-muted">
                Showing {performanceData.length > 0 ? 
                  `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalItems)}` : 
                  '0'} of {totalItems} items
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PerformanceList;

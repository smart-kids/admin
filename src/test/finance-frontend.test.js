// Finance Frontend Tests
// Comprehensive tests for all frontend finance calculations and queries

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeesManagement from '../pages/finance/fees.js';

// Mock Data
const mockSchools = [
  {
    id: 'school1',
    name: 'Test School',
    selectedSchool: { id: 'school1', name: 'Test School' }
  }
];

const mockClasses = [
  {
    id: 'class1',
    name: 'Grade 1',
    capacity: 30,
    students: ['student1', 'student2']
  },
  {
    id: 'class2', 
    name: 'Grade 2',
    capacity: 25,
    students: ['student3', 'student4', 'student5']
  }
];

const mockTerms = [
  {
    id: 'term1',
    name: 'Term 1 2024',
    startDate: '2024-01-01',
    endDate: '2024-04-30'
  },
  {
    id: 'term2',
    name: 'Term 2 2024', 
    startDate: '2024-05-01',
    endDate: '2024-08-31'
  }
];

const mockFeeStructures = [
  {
    id: 'fs1',
    school: 'school1',
    class: 'class1',
    term: 'term1',
    feeType: 'TUITION',
    amount: 10000,
    description: 'Main tuition fee',
    isRequired: true,
    isActive: true
  },
  {
    id: 'fs2',
    school: 'school1',
    class: 'class1', 
    term: 'term1',
    feeType: 'TRANSPORT',
    amount: 1500,
    description: 'School bus service',
    isRequired: false,
    isActive: true
  },
  {
    id: 'fs3',
    school: 'school1',
    class: 'class1',
    term: 'term1',
    feeType: 'ICT',
    amount: 800,
    description: 'Computer lab fees',
    isRequired: true,
    isActive: true
  },
  {
    id: 'fs4',
    school: 'school1',
    class: 'class1',
    term: 'term2',
    feeType: 'TUITION',
    amount: 12000,
    description: 'Updated tuition for term 2',
    isRequired: true,
    isActive: true
  }
];

const mockStudents = [
  {
    id: 'student1',
    names: 'John Doe',
    class: 'class1',
    term: 'term1',
    parent: 'parent1',
    school: 'school1'
  },
  {
    id: 'student2',
    names: 'Jane Smith',
    class: 'class1',
    term: 'term1',
    parent: 'parent2',
    school: 'school1'
  }
];

const mockParents = [
  {
    id: 'parent1',
    name: 'John Parent',
    phone: '0712345678',
    school: 'school1'
  },
  {
    id: 'parent2',
    name: 'Jane Parent', 
    phone: '0723456789',
    school: 'school1'
  }
];

const mockCharges = [
  {
    id: 'charge1',
    parent: 'parent1',
    student: 'student1',
    term: 'term1',
    chargeType: 'EXTRA_BOOKS',
    amount: 500,
    reason: 'Additional textbooks',
    date: '2024-02-15'
  },
  {
    id: 'charge2',
    parent: 'parent2',
    student: 'student2',
    term: 'term1',
    chargeType: 'UNIFORM',
    amount: 2000,
    reason: 'School uniform',
    date: '2024-01-20'
  }
];

const mockPayments = [
  {
    id: 'payment1',
    parent: 'parent1',
    student: 'student1',
    term: 'term1',
    amount: 5000,
    method: 'CASH',
    date: '2024-01-25',
    status: 'COMPLETED'
  },
  {
    id: 'payment2',
    parent: 'parent2',
    student: 'student2',
    term: 'term1',
    amount: 8000,
    method: 'MPESA',
    date: '2024-02-10',
    status: 'COMPLETED'
  }
];

// Mock Data Service
const mockData = {
  schools: {
    subscribe: (callback) => {
      callback(mockSchools);
      return { unsubscribe: jest.fn() };
    }
  },
  classes: {
    subscribe: (callback) => {
      callback({ classes: mockClasses });
      return { unsubscribe: jest.fn() };
    }
  },
  terms: {
    subscribe: (callback) => {
      callback({ terms: mockTerms });
      return { unsubscribe: jest.fn() };
    }
  },
  students: {
    subscribe: (callback) => {
      callback({ students: mockStudents });
      return { unsubscribe: jest.fn() };
    }
  },
  parents: {
    subscribe: (callback) => {
      callback({ parents: mockParents });
      return { unsubscribe: jest.fn() };
    }
  },
  feeStructures: {
    subscribe: (callback) => {
      callback({ feeStructures: mockFeeStructures });
      return { unsubscribe: jest.fn() };
    }
  },
  charges: {
    subscribe: (callback) => {
      callback({ charges: mockCharges });
      return { unsubscribe: jest.fn() };
    }
  },
  payments: {
    subscribe: (callback) => {
      callback({ payments: mockPayments });
      return { unsubscribe: jest.fn() };
    }
  }
};

// Mock GraphQL queries
const mockGraphQL = {
  query: jest.fn(),
  mutate: jest.fn()
};

// Helper functions for testing calculations
const calculateExpectedFees = (studentId, classId, termId, feeStructures) => {
  const studentFees = feeStructures.filter(fs => 
    String(fs.class) === String(classId) && 
    String(fs.term) === String(termId) && 
    fs.isActive === true
  );
  
  return studentFees.reduce((total, fs) => total + parseFloat(fs.amount), 0);
};

const calculateTotalCharges = (studentId, charges) => {
  const studentCharges = charges.filter(charge => 
    String(charge.student) === String(studentId)
  );
  return studentCharges.reduce((total, charge) => total + parseFloat(charge.amount), 0);
};

const calculateTotalPayments = (studentId, payments) => {
  const studentPayments = payments.filter(payment => 
    String(payment.student) === String(studentId) && 
    payment.status === 'COMPLETED'
  );
  return studentPayments.reduce((total, payment) => total + parseFloat(payment.amount), 0);
};

describe('Finance Frontend - Fee Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the Data service
    global.Data = mockData;
    
    // Mock GraphQL
    global.gql = jest.fn((query) => query);
    global.client = {
      query: mockGraphQL.query,
      mutate: mockGraphQL.mutate
    };
  });

  describe('Component Initialization and Data Loading', () => {
    test('should initialize with all required data subscriptions', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Finance Management')).toBeInTheDocument();
      });
      
      // Verify data subscriptions were called
      expect(mockData.schools.subscribe).toHaveBeenCalled();
      expect(mockData.classes.subscribe).toHaveBeenCalled();
      expect(mockData.terms.subscribe).toHaveBeenCalled();
      expect(mockData.students.subscribe).toHaveBeenCalled();
      expect(mockData.parents.subscribe).toHaveBeenCalled();
      expect(mockData.feeStructures.subscribe).toHaveBeenCalled();
      expect(mockData.charges.subscribe).toHaveBeenCalled();
      expect(mockData.payments.subscribe).toHaveBeenCalled();
    });

    test('should display school, class, and term selectors', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('School')).toBeInTheDocument();
        expect(screen.getByText('Class (Students)...')).toBeInTheDocument();
        expect(screen.getByText('Term...')).toBeInTheDocument();
      });
    });

    test('should auto-select default school, class, and term', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        // Check if default selections are made
        expect(screen.getByDisplayValue('Test School')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Fee Structure Calculations', () => {
    test('should calculate correct total expected fees for student', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        // Verify fee structures are loaded
        expect(screen.getByText('Finance Management')).toBeInTheDocument();
      });

      // Test calculation logic
      const studentId = 'student1';
      const classId = 'class1';
      const termId = 'term1';
      
      const expectedFees = calculateExpectedFees(studentId, classId, termId, mockFeeStructures);
      expect(expectedFees).toBe(12300); // 10000 + 1500 + 800
    });

    test('should handle multi-term fee calculations correctly', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Finance Management')).toBeInTheDocument();
      });

      // Test term 1 fees
      const term1Fees = calculateExpectedFees('student1', 'class1', 'term1', mockFeeStructures);
      expect(term1Fees).toBe(12300);

      // Test term 2 fees
      const term2Fees = calculateExpectedFees('student1', 'class1', 'term2', mockFeeStructures);
      expect(term2Fees).toBe(12000); // Only tuition for term 2
    });

    test('should filter inactive fee structures from calculations', async () => {
      // Add inactive fee structure
      const feeStructuresWithInactive = [
        ...mockFeeStructures,
        {
          id: 'fs5',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'INACTIVE_FEE',
          amount: 5000,
          description: 'Inactive fee',
          isRequired: false,
          isActive: false
        }
      ];

      const activeFees = feeStructuresWithInactive.filter(fs => fs.isActive === true);
      const expectedFees = activeFees.reduce((total, fs) => total + parseFloat(fs.amount), 0);
      
      expect(expectedFees).toBe(12300); // Should not include inactive fee
    });
  });

  describe('Charge Calculations', () => {
    test('should calculate total charges for student', () => {
      const studentId = 'student1';
      const totalCharges = calculateTotalCharges(studentId, mockCharges);
      expect(totalCharges).toBe(500); // Only one charge for student1
    });

    test('should handle multiple charges for same student', () => {
      const studentId = 'student2';
      const totalCharges = calculateTotalCharges(studentId, [
        ...mockCharges,
        {
          id: 'charge3',
          parent: 'parent2',
          student: 'student2',
          term: 'term1',
          chargeType: 'SPORTS',
          amount: 300,
          reason: 'Sports equipment',
          date: '2024-03-01'
        }
      ]);
      expect(totalCharges).toBe(2300); // 2000 + 300
    });
  });

  describe('Payment Calculations', () => {
    test('should calculate total payments for student', () => {
      const studentId = 'student1';
      const totalPayments = calculateTotalPayments(studentId, mockPayments);
      expect(totalPayments).toBe(5000);
    });

    test('should only count completed payments', () => {
      const studentId = 'student2';
      const paymentsWithPending = [
        ...mockPayments,
        {
          id: 'payment3',
          parent: 'parent2',
          student: 'student2',
          term: 'term1',
          amount: 2000,
          method: 'BANK',
          date: '2024-03-15',
          status: 'PENDING'
        }
      ];
      
      const totalPayments = calculateTotalPayments(studentId, paymentsWithPending);
      expect(totalPayments).toBe(8000); // Should not include pending payment
    });
  });

  describe('Balance Calculations', () => {
    test('should calculate correct student balance', () => {
      const studentId = 'student1';
      const classId = 'class1';
      const termId = 'term1';
      
      const expectedFees = calculateExpectedFees(studentId, classId, termId, mockFeeStructures);
      const totalCharges = calculateTotalCharges(studentId, mockCharges);
      const totalPayments = calculateTotalPayments(studentId, mockPayments);
      
      const balance = (expectedFees + totalCharges) - totalPayments;
      expect(balance).toBe(7800); // (12300 + 500) - 5000 = 7800
    });

    test('should handle overpayment scenarios', () => {
      const studentId = 'student2';
      const classId = 'class1';
      const termId = 'term1';
      
      const expectedFees = calculateExpectedFees(studentId, classId, termId, mockFeeStructures);
      const totalCharges = calculateTotalCharges(studentId, mockCharges);
      const totalPayments = calculateTotalPayments(studentId, mockPayments);
      
      const balance = (expectedFees + totalCharges) - totalPayments;
      expect(balance).toBe(-5700); // (12300 + 2000) - 8000 = -5700 (overpayment)
    });
  });

  describe('Fee Structure Breakdown', () => {
    test('should group fee structures by type correctly', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const classFees = mockFeeStructures.filter(fs => 
        String(fs.class) === String(classId) && 
        String(fs.term) === String(termId) && 
        fs.isActive === true
      );

      const groupedByType = {};
      classFees.forEach(fs => {
        if (!groupedByType[fs.feeType]) {
          groupedByType[fs.feeType] = {
            feeType: fs.feeType,
            totalAmount: 0,
            count: 0,
            descriptions: []
          };
        }
        groupedByType[fs.feeType].totalAmount += parseFloat(fs.amount);
        groupedByType[fs.feeType].count += 1;
        groupedByType[fs.feeType].descriptions.push(fs.description);
      });

      expect(groupedByType.TUITION.totalAmount).toBe(10000);
      expect(groupedByType.TUITION.count).toBe(1);
      expect(groupedByType.TRANSPORT.totalAmount).toBe(1500);
      expect(groupedByType.TRANSPORT.count).toBe(1);
      expect(groupedByType.ICT.totalAmount).toBe(800);
      expect(groupedByType.ICT.count).toBe(1);
    });

    test('should separate required vs optional fees', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const classFees = mockFeeStructures.filter(fs => 
        String(fs.class) === String(classId) && 
        String(fs.term) === String(termId) && 
        fs.isActive === true
      );

      const requiredFees = classFees.filter(fs => fs.isRequired === true);
      const optionalFees = classFees.filter(fs => fs.isRequired === false);

      const requiredTotal = requiredFees.reduce((sum, fs) => sum + parseFloat(fs.amount), 0);
      const optionalTotal = optionalFees.reduce((sum, fs) => sum + parseFloat(fs.amount), 0);

      expect(requiredTotal).toBe(10800); // TUITION + ICT
      expect(optionalTotal).toBe(1500); // TRANSPORT
      expect(requiredFees).toHaveLength(2);
      expect(optionalFees).toHaveLength(1);
    });
  });

  describe('Class-Level Calculations', () => {
    test('should calculate total expected fees for entire class', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const classFees = mockFeeStructures.filter(fs => 
        String(fs.class) === String(classId) && 
        String(fs.term) === String(termId) && 
        fs.isActive === true
      );

      const totalExpected = classFees.reduce((sum, fs) => sum + parseFloat(fs.amount), 0);
      const studentCount = mockStudents.filter(student => 
        String(student.class) === String(classId) && 
        String(student.term) === String(termId)
      ).length;

      const classTotal = totalExpected * studentCount;
      expect(classTotal).toBe(24600); // 12300 * 2 students
    });

    test('should calculate class collection rate', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const classStudents = mockStudents.filter(student => 
        String(student.class) === String(classId) && 
        String(student.term) === String(termId)
      );

      let totalExpected = 0;
      let totalCollected = 0;

      classStudents.forEach(student => {
        const expectedFees = calculateExpectedFees(student.id, classId, termId, mockFeeStructures);
        const totalCharges = calculateTotalCharges(student.id, mockCharges);
        const totalPayments = calculateTotalPayments(student.id, mockPayments);
        
        totalExpected += expectedFees + totalCharges;
        totalCollected += totalPayments;
      });

      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
      expect(collectionRate).toBeCloseTo(40.65, 2); // (5000 + 8000) / (24600 + 2500) * 100
    });
  });

  describe('Edge Cases', () => {
    test('should handle student with no fee structures', () => {
      const studentId = 'student3';
      const classId = 'class2';
      const termId = 'term1';
      
      const expectedFees = calculateExpectedFees(studentId, classId, termId, mockFeeStructures);
      expect(expectedFees).toBe(0);
    });

    test('should handle zero amount fees', () => {
      const feeStructuresWithZero = [
        ...mockFeeStructures,
        {
          id: 'fs6',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'ZERO_FEE',
          amount: 0,
          description: 'Zero amount fee',
          isRequired: false,
          isActive: true
        }
      ];

      const expectedFees = feeStructuresWithZero.reduce((sum, fs) => sum + parseFloat(fs.amount), 0);
      expect(expectedFees).toBe(12300); // Zero fee should not affect total
    });

    test('should handle decimal amounts correctly', () => {
      const feeStructuresWithDecimal = [
        ...mockFeeStructures,
        {
          id: 'fs7',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'DECIMAL_FEE',
          amount: 123.45,
          description: 'Decimal amount fee',
          isRequired: false,
          isActive: true
        }
      ];

      const expectedFees = feeStructuresWithDecimal.reduce((sum, fs) => sum + parseFloat(fs.amount), 0);
      expect(expectedFees).toBeCloseTo(12423.45, 2);
    });
  });

  describe('UI Integration Tests', () => {
    test('should display fee breakdown section when fee structures exist', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Fee Structure Breakdown')).toBeInTheDocument();
      });
    });

    test('should show correct totals in insights section', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        // Should show calculated totals
        expect(screen.getByText(/Total Collected/)).toBeInTheDocument();
        expect(screen.getByText(/Total Expected/)).toBeInTheDocument();
        expect(screen.getByText(/Total Balance/)).toBeInTheDocument();
      });
    });

    test('should handle term selection change', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        const termSelect = screen.getByLabelText('Term...');
        expect(termSelect).toBeInTheDocument();
      });

      const termSelect = screen.getByLabelText('Term...');
      fireEvent.change(termSelect, { target: { value: 'term2' } });

      await waitFor(() => {
        // Should recalculate for new term
        expect(screen.getByText('Finance Management')).toBeInTheDocument();
      });
    });

    test('should handle class selection change', async () => {
      render(<FeesManagement />);
      
      await waitFor(() => {
        const classSelect = screen.getByLabelText('Class (Students)...');
        expect(classSelect).toBeInTheDocument();
      });

      const classSelect = screen.getByLabelText('Class (Students)...');
      fireEvent.change(classSelect, { target: { value: 'class2' } });

      await waitFor(() => {
        // Should recalculate for new class
        expect(screen.getByText('Finance Management')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeFeeStructures = [];
      for (let i = 0; i < 100; i++) {
        largeFeeStructures.push({
          id: `fs_large_${i}`,
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: `FEE_TYPE_${i}`,
          amount: 100 + i,
          description: `Large dataset fee ${i}`,
          isRequired: i % 2 === 0,
          isActive: true
        });
      }

      const startTime = performance.now();
      
      const totalExpected = largeFeeStructures.reduce((sum, fs) => sum + parseFloat(fs.amount), 0);
      
      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      expect(totalExpected).toBeGreaterThan(0);
      expect(calculationTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});

describe('Finance Frontend - GraphQL Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.client = { query: mockGraphQL.query };
    global.gql = jest.fn((query) => query);
  });

  test('should execute student fees query correctly', async () => {
    const studentFeesQuery = `
      query GetStudentFees($studentId: String!) {
        studentFees(studentId: $studentId) {
          studentId
          studentName
          className
          feesByTerm {
            termName
            totalAmount
            requiredAmount
            optionalAmount
            feeTypes {
              feeType
              totalAmount
              isRequired
            }
          }
          overallTotals {
            totalAmount
            requiredAmount
            optionalAmount
          }
        }
      }
    `;

    mockGraphQL.query.mockResolvedValue({
      data: {
        studentFees: {
          studentId: 'student1',
          studentName: 'John Doe',
          className: 'Grade 1',
          feesByTerm: [
            {
              termName: 'Term 1 2024',
              totalAmount: 12300,
              requiredAmount: 10800,
              optionalAmount: 1500,
              feeTypes: [
                { feeType: 'TUITION', totalAmount: 10000, isRequired: true },
                { feeType: 'TRANSPORT', totalAmount: 1500, isRequired: false },
                { feeType: 'ICT', totalAmount: 800, isRequired: true }
              ]
            }
          ],
          overallTotals: {
            totalAmount: 12300,
            requiredAmount: 10800,
            optionalAmount: 1500
          }
        }
      }
    });

    const result = await global.client.query({
      query: studentFeesQuery,
      variables: { studentId: 'student1' }
    });

    expect(mockGraphQL.query).toHaveBeenCalledWith({
      query: studentFeesQuery,
      variables: { studentId: 'student1' }
    });

    expect(result.data.studentFees.overallTotals.totalAmount).toBe(12300);
    expect(result.data.studentFees.overallTotals.requiredAmount).toBe(10800);
    expect(result.data.studentFees.overallTotals.optionalAmount).toBe(1500);
  });

  test('should execute class fees query correctly', async () => {
    const classFeesQuery = `
      query GetClassFees($classId: String!, $termId: String!) {
        classFees(classId: $classId, termId: $termId) {
          classId
          className
          feesByType {
            feeType
            totalAmount
            count
            isRequired
          }
          totals {
            totalAmount
            requiredAmount
            optionalAmount
          }
          studentCount
        }
      }
    `;

    mockGraphQL.query.mockResolvedValue({
      data: {
        classFees: {
          classId: 'class1',
          className: 'Grade 1',
          feesByType: [
            { feeType: 'TUITION', totalAmount: 10000, count: 1, isRequired: true },
            { feeType: 'TRANSPORT', totalAmount: 1500, count: 1, isRequired: false },
            { feeType: 'ICT', totalAmount: 800, count: 1, isRequired: true }
          ],
          totals: {
            totalAmount: 12300,
            requiredAmount: 10800,
            optionalAmount: 1500
          },
          studentCount: 2
        }
      }
    });

    const result = await global.client.query({
      query: classFeesQuery,
      variables: { classId: 'class1', termId: 'term1' }
    });

    expect(mockGraphQL.query).toHaveBeenCalledWith({
      query: classFeesQuery,
      variables: { classId: 'class1', termId: 'term1' }
    });

    expect(result.data.classFees.totals.totalAmount).toBe(12300);
    expect(result.data.classFees.studentCount).toBe(2);
  });

  test('should execute school fee summary query correctly', async () => {
    const schoolSummaryQuery = `
      query GetSchoolFeeSummary($schoolId: String!) {
        schoolFeeSummary(schoolId: $schoolId) {
          schoolId
          totalFeeStructures
          totalAmount
          classes {
            className
            feeCount
            totalAmount
          }
          terms {
            termName
            feeCount
            totalAmount
          }
          feeTypes {
            feeType
            count
            totalAmount
          }
        }
      }
    `;

    mockGraphQL.query.mockResolvedValue({
      data: {
        schoolFeeSummary: {
          schoolId: 'school1',
          totalFeeStructures: 4,
          totalAmount: 24300,
          classes: [
            { className: 'Grade 1', feeCount: 4, totalAmount: 24300 }
          ],
          terms: [
            { termName: 'Term 1 2024', feeCount: 3, totalAmount: 12300 },
            { termName: 'Term 2 2024', feeCount: 1, totalAmount: 12000 }
          ],
          feeTypes: [
            { feeType: 'TUITION', count: 2, totalAmount: 22000 },
            { feeType: 'TRANSPORT', count: 1, totalAmount: 1500 },
            { feeType: 'ICT', count: 1, totalAmount: 800 }
          ]
        }
      }
    });

    const result = await global.client.query({
      query: schoolSummaryQuery,
      variables: { schoolId: 'school1' }
    });

    expect(mockGraphQL.query).toHaveBeenCalledWith({
      query: schoolSummaryQuery,
      variables: { schoolId: 'school1' }
    });

    expect(result.data.schoolFeeSummary.totalAmount).toBe(24300);
    expect(result.data.schoolFeeSummary.totalFeeStructures).toBe(4);
  });
});

export {
  calculateExpectedFees,
  calculateTotalCharges,
  calculateTotalPayments,
  mockData,
  mockFeeStructures,
  mockStudents,
  mockParents,
  mockCharges,
  mockPayments
};

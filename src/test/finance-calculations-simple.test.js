// Simple Finance Calculations Test
// Tests the core calculation logic without complex React rendering

// Mock Data
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
  }
];

// Helper functions (copied from frontend logic)
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

const calculateStudentBalance = (studentId, classId, termId, feeStructures, charges, payments) => {
  const expectedFees = calculateExpectedFees(studentId, classId, termId, feeStructures);
  const totalCharges = calculateTotalCharges(studentId, charges);
  const totalPayments = calculateTotalPayments(studentId, payments);
  
  return (expectedFees + totalCharges) - totalPayments;
};

const getFeeStructureBreakdown = (classId, termId, feeStructures) => {
  const classFees = feeStructures.filter(fs => 
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

  return Object.values(groupedByType);
};

// Tests
describe('Finance Calculations - Core Logic', () => {
  
  describe('Fee Structure Calculations', () => {
    test('should calculate correct total expected fees for student', () => {
      const studentId = 'student1';
      const classId = 'class1';
      const termId = 'term1';
      
      const expectedFees = calculateExpectedFees(studentId, classId, termId, mockFeeStructures);
      expect(expectedFees).toBe(12300); // 10000 + 1500 + 800
    });

    test('should filter inactive fee structures from calculations', () => {
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

      const expectedFees = calculateExpectedFees('student1', 'class1', 'term1', feeStructuresWithInactive);
      expect(expectedFees).toBe(12300); // Should not include inactive fee
    });

    test('should handle student with no fee structures', () => {
      const expectedFees = calculateExpectedFees('student3', 'class2', 'term1', mockFeeStructures);
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

      const expectedFees = calculateExpectedFees('student1', 'class1', 'term1', feeStructuresWithZero);
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

      const expectedFees = calculateExpectedFees('student1', 'class1', 'term1', feeStructuresWithDecimal);
      expect(expectedFees).toBeCloseTo(12423.45, 2);
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
      const multipleCharges = [
        ...mockCharges,
        {
          id: 'charge2',
          parent: 'parent2',
          student: 'student2',
          term: 'term1',
          chargeType: 'UNIFORM',
          amount: 2000,
          reason: 'School uniform',
          date: '2024-01-20'
        },
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
      ];
      
      const totalCharges = calculateTotalCharges(studentId, multipleCharges);
      expect(totalCharges).toBe(2300); // 2000 + 300
    });

    test('should handle student with no charges', () => {
      const totalCharges = calculateTotalCharges('student3', mockCharges);
      expect(totalCharges).toBe(0);
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
        {
          id: 'payment2',
          parent: 'parent2',
          student: 'student2',
          term: 'term1',
          amount: 8000,
          method: 'MPESA',
          date: '2024-02-10',
          status: 'COMPLETED'
        },
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

    test('should handle student with no payments', () => {
      const totalPayments = calculateTotalPayments('student3', mockPayments);
      expect(totalPayments).toBe(0);
    });
  });

  describe('Balance Calculations', () => {
    test('should calculate correct student balance', () => {
      const studentId = 'student1';
      const classId = 'class1';
      const termId = 'term1';
      
      const balance = calculateStudentBalance(studentId, classId, termId, mockFeeStructures, mockCharges, mockPayments);
      expect(balance).toBe(7800); // (12300 + 500) - 5000 = 7800
    });

    test('should handle overpayment scenarios', () => {
      const studentId = 'student2';
      const classId = 'class1';
      const termId = 'term1';
      
      const overpaymentPayments = [
        {
          id: 'payment2',
          parent: 'parent2',
          student: 'student2',
          term: 'term1',
          amount: 15000,
          method: 'MPESA',
          date: '2024-02-10',
          status: 'COMPLETED'
        }
      ];
      
      const balance = calculateStudentBalance(studentId, classId, termId, mockFeeStructures, mockCharges, overpaymentPayments);
      expect(balance).toBe(-2700); // (12300 + 500) - 15000 = -2700 (overpayment)
    });

    test('should handle student with no financial activity', () => {
      const balance = calculateStudentBalance('student3', 'class2', 'term1', mockFeeStructures, [], []);
      expect(balance).toBe(0);
    });
  });

  describe('Fee Structure Breakdown', () => {
    test('should group fee structures by type correctly', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const breakdown = getFeeStructureBreakdown(classId, termId, mockFeeStructures);

      expect(breakdown).toHaveLength(3);
      
      const tuition = breakdown.find(item => item.feeType === 'TUITION');
      const transport = breakdown.find(item => item.feeType === 'TRANSPORT');
      const ict = breakdown.find(item => item.feeType === 'ICT');

      expect(tuition.totalAmount).toBe(10000);
      expect(tuition.count).toBe(1);
      expect(transport.totalAmount).toBe(1500);
      expect(transport.count).toBe(1);
      expect(ict.totalAmount).toBe(800);
      expect(ict.count).toBe(1);
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

    test('should handle class with no fee structures', () => {
      const breakdown = getFeeStructureBreakdown('class2', 'term1', mockFeeStructures);
      expect(breakdown).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', () => {
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

  describe('Edge Cases', () => {
    test('should handle null/undefined values gracefully', () => {
      const emptyFeeStructures = [];
      const emptyCharges = [];
      const emptyPayments = [];

      const expectedFees = calculateExpectedFees('student1', 'class1', 'term1', emptyFeeStructures);
      const totalCharges = calculateTotalCharges('student1', emptyCharges);
      const totalPayments = calculateTotalPayments('student1', emptyPayments);
      const balance = calculateStudentBalance('student1', 'class1', 'term1', emptyFeeStructures, emptyCharges, emptyPayments);

      expect(expectedFees).toBe(0);
      expect(totalCharges).toBe(0);
      expect(totalPayments).toBe(0);
      expect(balance).toBe(0);
    });

    test('should handle invalid amount values', () => {
      const feeStructuresWithInvalidAmounts = [
        {
          id: 'fs_invalid1',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'INVALID_FEE',
          amount: 'invalid',
          description: 'Invalid amount',
          isRequired: false,
          isActive: true
        },
        {
          id: 'fs_invalid2',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'NULL_FEE',
          amount: null,
          description: 'Null amount',
          isRequired: false,
          isActive: true
        }
      ];

      // Should handle invalid amounts gracefully
      expect(() => {
        calculateExpectedFees('student1', 'class1', 'term1', feeStructuresWithInvalidAmounts);
      }).not.toThrow();
    });
  });
});

// Export functions for potential use in other test files
module.exports = {
  calculateExpectedFees,
  calculateTotalCharges,
  calculateTotalPayments,
  calculateStudentBalance,
  getFeeStructureBreakdown,
  mockFeeStructures,
  mockCharges,
  mockPayments
};

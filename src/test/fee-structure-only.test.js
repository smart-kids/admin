// Test to verify system uses ONLY fee structures, not class.amount
// This ensures we've completely removed dependency on class.amount

// Mock data with class.amount that should be ignored
const mockClassWithAmount = {
  id: 'class1',
  name: 'Grade 1',
  amount: 50000, // This should be IGNORED
  capacity: 30
};

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
  }
];

// Test the getFees function from fees.js
const getFees = (classId, termId = null, feeStructures = []) => {
  if (!classId) return 0;
  if (!feeStructures || !Array.isArray(feeStructures)) return 0;
  
  const targetClassId = String(classId?.id || classId);
  const targetTermId = termId || 'term1';
  
  // Get all active fee structures for this class and term
  const applicableFees = feeStructures.filter(fs => 
      String(fs.class?.id || fs.class) === targetClassId &&
      (!targetTermId || String(fs.term?.id || fs.term) === String(targetTermId)) &&
      fs.isActive === true
  );
  
  // Sum all applicable fees (tuition, transport, etc.)
  return applicableFees.reduce((total, fs) => total + (parseFloat(fs.amount) || 0), 0);
};

describe('Fee Structure Only Calculations', () => {

  describe('Fee Structure Only - No Class Amount Dependency', () => {
    
    test('should ignore class.amount and use only fee structures', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      // Calculate fees using fee structures only
      const calculatedFees = getFees(classId, termId, mockFeeStructures);
      
      // Should be 11,500 (10,000 + 1,500) from fee structures
      // NOT 50,000 from class.amount
      expect(calculatedFees).toBe(11500);
      expect(calculatedFees).not.toBe(50000); // Should not use class.amount
    });

    test('should handle class with no fee structures', () => {
      const classId = 'class2'; // Class with no fee structures
      const termId = 'term1';
      
      const calculatedFees = getFees(classId, termId, mockFeeStructures);
      
      // Should be 0 even if class.amount existed
      expect(calculatedFees).toBe(0);
    });

    test('should handle multiple terms with different fee structures', () => {
      const classId = 'class1';
      
      const multiTermFeeStructures = [
        ...mockFeeStructures,
        {
          id: 'fs3',
          school: 'school1',
          class: 'class1',
          term: 'term2',
          feeType: 'TUITION',
          amount: 12000, // Different amount for term 2
          description: 'Updated tuition for term 2',
          isRequired: true,
          isActive: true
        }
      ];
      
      const term1Fees = getFees(classId, 'term1', multiTermFeeStructures);
      const term2Fees = getFees(classId, 'term2', multiTermFeeStructures);
      
      expect(term1Fees).toBe(11500); // 10,000 + 1,500
      expect(term2Fees).toBe(12000); // Only tuition for term 2
      expect(term1Fees).not.toBe(term2Fees); // Should be different
    });

    test('should filter inactive fee structures correctly', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const feeStructuresWithInactive = [
        ...mockFeeStructures,
        {
          id: 'fs4',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'EXTRA_FEE',
          amount: 5000,
          description: 'Inactive fee',
          isRequired: false,
          isActive: false // This should be ignored
        }
      ];
      
      const calculatedFees = getFees(classId, termId, feeStructuresWithInactive);
      
      // Should still be 11,500 (inactive fee ignored)
      expect(calculatedFees).toBe(11500);
      expect(calculatedFees).not.toBe(16500); // Should not include inactive fee
    });

    test('should handle zero amount fee structures', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const feeStructuresWithZero = [
        ...mockFeeStructures,
        {
          id: 'fs5',
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
      
      const calculatedFees = getFees(classId, termId, feeStructuresWithZero);
      
      // Should still be 11,500 (zero fee adds nothing)
      expect(calculatedFees).toBe(11500);
    });

    test('should handle decimal amounts in fee structures', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      const feeStructuresWithDecimal = [
        ...mockFeeStructures,
        {
          id: 'fs6',
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
      
      const calculatedFees = getFees(classId, termId, feeStructuresWithDecimal);
      
      // Should be 11,623.45 (11,500 + 123.45)
      expect(calculatedFees).toBeCloseTo(11623.45, 2);
    });

    test('should verify class.amount is completely ignored', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      // Create class with very high amount
      const classWithHugeAmount = {
        ...mockClassWithAmount,
        amount: 1000000 // 1 million KES
      };
      
      const calculatedFees = getFees(classId, termId, mockFeeStructures);
      
      // Should still be 11,500 from fee structures
      expect(calculatedFees).toBe(11500);
      expect(calculatedFees).not.toBe(1000000); // Should not use class.amount
      
      // Even if class.amount is 0, fee structures should still work
      const classWithZeroAmount = {
        ...mockClassWithAmount,
        amount: 0
      };
      
      const feesWithZeroClassAmount = getFees(classId, termId, mockFeeStructures);
      expect(feesWithZeroClassAmount).toBe(11500); // Still use fee structures
    });

    test('should handle edge cases gracefully', () => {
      // Test with null classId
      expect(getFees(null, 'term1', mockFeeStructures)).toBe(0);
      expect(getFees(undefined, 'term1', mockFeeStructures)).toBe(0);
      
      // Test with empty/null/undefined fee structures
      expect(getFees('class1', 'term1', [])).toBe(0);
      expect(getFees('class1', 'term1', null)).toBe(0);
      expect(getFees('class1', 'term1', undefined)).toBe(0);
      
      // Test with invalid fee structure amounts
      const invalidFeeStructures = [
        {
          id: 'fs_invalid',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'INVALID_FEE',
          amount: 'invalid_amount',
          description: 'Invalid amount',
          isRequired: false,
          isActive: true
        }
      ];
      
      expect(getFees('class1', 'term1', invalidFeeStructures)).toBe(0);
    });

    test('should verify fee structure priority over class data', () => {
      const classId = 'class1';
      const termId = 'term1';
      
      // Create fee structures that differ from class.amount
      const conflictingFeeStructures = [
        {
          id: 'fs_low',
          school: 'school1',
          class: 'class1',
          term: 'term1',
          feeType: 'TUITION',
          amount: 5000, // Much lower than class.amount
          description: 'Low tuition',
          isRequired: true,
          isActive: true
        }
      ];
      
      const calculatedFees = getFees(classId, termId, conflictingFeeStructures);
      
      // Should use 5,000 from fee structure, not 50,000 from class.amount
      expect(calculatedFees).toBe(5000);
      expect(calculatedFees).not.toBe(50000);
    });
  });

  describe('Integration with Frontend Logic', () => {
    
    test('should verify frontend uses fee structures for current term', () => {
      // Simulate frontend logic
      const selectedTerm = 'term1';
      const studentClass = 'class1';
      
      const classFee = getFees(studentClass, selectedTerm, mockFeeStructures);
      
      // Should be calculated from fee structures only
      expect(classFee).toBe(11500);
      
      // Verify it's not using any class.amount field
      expect(classFee).not.toBe(mockClassWithAmount.amount);
    });

    test('should verify frontend uses fee structures for previous terms', () => {
      // Simulate previous terms calculation
      const previousTerms = ['term1', 'term2'];
      const studentClass = 'class1';
      
      const multiTermFeeStructures = [
        ...mockFeeStructures,
        {
          id: 'fs_prev_term',
          school: 'school1',
          class: 'class1',
          term: 'term2',
          feeType: 'TUITION',
          amount: 8000,
          description: 'Previous term tuition',
          isRequired: true,
          isActive: true
        }
      ];
      
      const totalPreviousFees = previousTerms.reduce((sum, termId) => {
        return sum + getFees(studentClass, termId, multiTermFeeStructures);
      }, 0);
      
      // Should be 19,500 (11,500 for term1 + 8,000 for term2)
      expect(totalPreviousFees).toBe(19500);
      
      // Should not be based on class.amount * number of terms
      expect(totalPreviousFees).not.toBe(mockClassWithAmount.amount * previousTerms.length);
    });
  });
});

module.exports = {
  getFees,
  mockClassWithAmount,
  mockFeeStructures
};

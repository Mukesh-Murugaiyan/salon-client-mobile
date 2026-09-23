import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Validation } from '../src/utils/Validation.ts';
import { NumberUtils } from '../src/utils/NumberUtils.ts';
import { StringUtils } from '../src/utils/StringUtils.ts';
import { DateTime } from '../src/utils/DateTime.ts';

describe('Validation Utility', () => {
  it('validates email addresses properly', () => {
    assert.equal(Validation.isValidEmail('user@saloncrm.com'), true);
    assert.equal(Validation.isValidEmail('admin.test+tag@example.co.uk'), true);
    assert.equal(Validation.isValidEmail('invalid-email'), false);
    assert.equal(Validation.isValidEmail('@missinguser.com'), false);
    assert.equal(Validation.isValidEmail(''), false);
    assert.equal(Validation.isValidEmail(null), false);
  });

  it('validates passwords and minimum length', () => {
    assert.equal(Validation.isValidPassword('secret123', 6), true);
    assert.equal(Validation.isValidPassword('123', 6), false);
    assert.equal(Validation.isValidPassword('', 6), false);
    assert.equal(Validation.isValidPassword(null, 6), false);
  });

  it('validates login credentials correctly', () => {
    const valid = Validation.validateLoginCredentials('owner@saloncrm.com', 'password123');
    assert.equal(valid.isValid, true);
    assert.equal(valid.error, undefined);

    const emptyEmail = Validation.validateLoginCredentials('', 'password123');
    assert.equal(emptyEmail.isValid, false);
    assert.match(emptyEmail.error || '', /email/i);

    const invalidEmail = Validation.validateLoginCredentials('notanemail', 'password123');
    assert.equal(invalidEmail.isValid, false);

    const emptyPass = Validation.validateLoginCredentials('owner@saloncrm.com', '');
    assert.equal(emptyPass.isValid, false);
    assert.match(emptyPass.error || '', /password/i);
  });

  it('validates phone numbers', () => {
    assert.equal(Validation.isValidPhone('+919876543210'), true);
    assert.equal(Validation.isValidPhone('9876543210'), true);
    assert.equal(Validation.isValidPhone('123'), false);
    assert.equal(Validation.isValidPhone(''), false);
  });

  it('validates geographic coordinates', () => {
    assert.equal(Validation.isValidCoordinates(12.9716, 77.5946), true);
    assert.equal(Validation.isValidCoordinates(-90, 180), true);
    assert.equal(Validation.isValidCoordinates(91, 50), false);
    assert.equal(Validation.isValidCoordinates(50, 181), false);
    assert.equal(Validation.isValidCoordinates(null, 50), false);
  });
});

describe('NumberUtils Utility', () => {
  it('formats currency correctly in INR', () => {
    assert.equal(NumberUtils.formatCurrency(500), '₹500');
    assert.equal(NumberUtils.formatCurrency(0), '₹0');
    assert.equal(NumberUtils.formatCurrency(null), '₹0');
    assert.equal(NumberUtils.formatCurrency(1250, '$'), '$1,250');
  });

  it('clamps values within bounds', () => {
    assert.equal(NumberUtils.clamp(5, 1, 10), 5);
    assert.equal(NumberUtils.clamp(0, 1, 10), 1);
    assert.equal(NumberUtils.clamp(15, 1, 10), 10);
  });

  it('rounds numbers to decimal places', () => {
    assert.equal(NumberUtils.round(3.14159, 2), 3.14);
    assert.equal(NumberUtils.round(3.145, 2), 3.15);
  });

  it('parses numbers safely with fallback', () => {
    assert.equal(NumberUtils.parseNumber('42', 0), 42);
    assert.equal(NumberUtils.parseNumber('invalid', 99), 99);
    assert.equal(NumberUtils.parseNumber(null, 10), 10);
  });
});

describe('StringUtils Utility', () => {
  it('capitalizes string', () => {
    assert.equal(StringUtils.capitalize('hello'), 'Hello');
    assert.equal(StringUtils.capitalize(''), '');
    assert.equal(StringUtils.capitalize(null), '');
  });

  it('converts to title case', () => {
    assert.equal(StringUtils.toTitleCase('hair cut and styling'), 'Hair Cut And Styling');
  });

  it('truncates string with ellipsis', () => {
    assert.equal(StringUtils.truncate('Short string', 20), 'Short string');
    assert.equal(StringUtils.truncate('This is a very long string that should be cut off', 10), 'This is a...');
  });

  it('extracts initials correctly', () => {
    assert.equal(StringUtils.getInitials('John Doe'), 'JD');
    assert.equal(StringUtils.getInitials('Receptionist'), 'RE');
    assert.equal(StringUtils.getInitials(''), '');
  });

  it('masks sensitive text', () => {
    assert.equal(StringUtils.maskSensitive('9876543210', 4), '******3210');
  });
});

describe('DateTime Utility', () => {
  it('converts 24h time to 12h format', () => {
    assert.equal(DateTime.formatTime12h('09:00'), '9:00 AM');
    assert.equal(DateTime.formatTime12h('13:30'), '1:30 PM');
    assert.equal(DateTime.formatTime12h('00:15'), '12:15 AM');
    assert.equal(DateTime.formatTime12h('12:00'), '12:00 PM');
  });

  it('calculates duration between times', () => {
    assert.equal(DateTime.calculateDuration('09:00', '10:30'), '1 hr 30 mins');
    assert.equal(DateTime.calculateDuration('14:00', '14:45'), '45 mins');
    assert.equal(DateTime.calculateDuration('10:00', '12:00'), '2 hrs');
  });

  it('formats dates and times', () => {
    assert.match(DateTime.getTodayLocalDateString(), /^\d{4}-\d{2}-\d{2}$/);
    assert.match(DateTime.getTodayUtcDateString(), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(DateTime.formatDate('2026-09-23T10:00:00Z'), 'Sep 23, 2026');
  });
});

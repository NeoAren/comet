import { Method } from './types'


// Base URL for URLPattern pathname testing, the actual value is irrelevant
export const BASE_URL = 'https://comet'

// Parse an array or CSV to an array
export function parseListValue(value: string | string[]) {
  return Array.isArray(value) ? value : value.split(',').map(s => s.trim())
}

// Checks a pathname against another one, returns whether they match or not
export function comparePathnames(check?: string, against?: string): boolean {
  if (!against || against === '*') return true
  return new URLPattern(against, BASE_URL).test(check, BASE_URL)
}

// Checks a method against another one, returns whether they match or not
export function compareMethods(check?: string, against?: string): boolean {
  if (!against || against === Method.ALL) return true
  return check === against
}

// Checks a compatibility date against another one, returns whether they match or not
export function compareCompatibilityDates(check?: string, against?: string): boolean {
  if (!against) return true // Checking anything against a default will match
  if (!check) return false // Checking nothing against a non-default will not match
  return new Date(check) >= new Date(against) // Checking a newer date against an older one will match
}

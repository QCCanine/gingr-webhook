import { FieldSet } from "airtable";

export interface DogFields extends FieldSet {
    "Animal Id": number,
    "Dog": string,
    "Feeding": string,
    "Belongings": string,
    "Medication": string,
    "Lunch": string,
    "Kongs/Dental Chews": string,
    "Grooming Services": string,
    "Departure Date/Time": string,
    "Type": string,
}
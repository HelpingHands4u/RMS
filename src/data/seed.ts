// ============================================================
//  DEMO DATA — ACADEMIC SIMULATION
//  Indian-railway-style names/codes for demonstration only.
//  NOT live railway data. NOT connected to IRCTC.
// ============================================================
import type { ClassType } from "@/types";

export const DEMO_STATIONS = [
  { stationCode: "NDLS", stationName: "New Delhi", city: "New Delhi", state: "Delhi" },
  { stationCode: "HWH", stationName: "Howrah", city: "Kolkata", state: "West Bengal" },
  { stationCode: "BZA", stationName: "Vijayawada", city: "Vijayawada", state: "Andhra Pradesh" },
  { stationCode: "VSKP", stationName: "Visakhapatnam", city: "Visakhapatnam", state: "Andhra Pradesh" },
  { stationCode: "BBS", stationName: "Bhubaneswar", city: "Bhubaneswar", state: "Odisha" },
  { stationCode: "MAS", stationName: "Chennai Central", city: "Chennai", state: "Tamil Nadu" },
  { stationCode: "SC", stationName: "Secunderabad", city: "Hyderabad", state: "Telangana" },
  { stationCode: "KGP", stationName: "Kharagpur", city: "Kharagpur", state: "West Bengal" },
  { stationCode: "HYB", stationName: "Hyderabad", city: "Hyderabad", state: "Telangana" },
  { stationCode: "BPL", stationName: "Bhopal", city: "Bhopal", state: "Madhya Pradesh" },
];

/** [stationCode, arrival, departure, cumulative km, dayOffset] */
type Stop = [string, string, string, number, number];

export interface DemoTrain {
  trainNumber: string;
  trainName: string;
  trainType: string;
  routeName: string;
  stops: Stop[];
  coaches: [ClassType, number][]; // class, number of coaches
}

export const DEMO_TRAINS: DemoTrain[] = [
  {
    trainNumber: "12001", trainName: "Rajdhani Express", trainType: "Rajdhani", routeName: "New Delhi – Bhopal (Demo)",
    stops: [["NDLS", "", "06:00", 0, 0], ["BPL", "14:25", "", 702, 0]],
    coaches: [["1A", 1], ["2A", 1], ["CC", 2]],
  },
  {
    trainNumber: "12841", trainName: "Coromandel Express", trainType: "Superfast", routeName: "Chennai Central – Howrah (Demo)",
    stops: [["MAS", "", "07:00", 0, 0], ["BZA", "13:30", "13:45", 432, 0], ["VSKP", "19:40", "20:00", 782, 0], ["BBS", "02:10", "02:20", 1220, 1], ["KGP", "06:15", "06:20", 1546, 1], ["HWH", "08:10", "", 1662, 1]],
    coaches: [["2A", 1], ["3A", 2], ["SL", 2]],
  },
  {
    trainNumber: "12860", trainName: "Gitanjali Express", trainType: "Superfast", routeName: "Secunderabad – Howrah (Demo)",
    stops: [["SC", "", "05:30", 0, 0], ["BZA", "10:50", "11:05", 351, 0], ["VSKP", "17:00", "17:20", 701, 0], ["BBS", "23:30", "23:40", 1139, 0], ["KGP", "03:35", "03:40", 1465, 1], ["HWH", "05:30", "", 1581, 1]],
    coaches: [["1A", 1], ["2A", 1], ["3A", 1], ["SL", 2]],
  },
  {
    trainNumber: "12302", trainName: "Howrah Rajdhani", trainType: "Rajdhani", routeName: "New Delhi – Howrah (Demo)",
    stops: [["NDLS", "", "16:55", 0, 0], ["KGP", "08:15", "08:20", 1331, 1], ["HWH", "09:55", "", 1447, 1]],
    coaches: [["1A", 1], ["2A", 1], ["3A", 2]],
  },
  {
    trainNumber: "12723", trainName: "Telangana Express", trainType: "Superfast", routeName: "Hyderabad – New Delhi (Demo)",
    stops: [["HYB", "", "06:00", 0, 0], ["SC", "06:20", "06:30", 10, 0], ["BPL", "20:10", "20:20", 1100, 0], ["NDLS", "07:40", "", 1677, 1]],
    coaches: [["2A", 1], ["3A", 1], ["SL", 2]],
  },
  {
    trainNumber: "12627", trainName: "Karnataka Express", trainType: "Superfast", routeName: "Chennai Central – New Delhi (Demo)",
    stops: [["MAS", "", "19:20", 0, 0], ["SC", "07:30", "07:45", 790, 1], ["BPL", "21:00", "21:10", 1590, 1], ["NDLS", "06:30", "", 2295, 2]],
    coaches: [["2A", 1], ["3A", 1], ["SL", 1], ["CC", 1]],
  },
];

export const COACH_PREFIX: Record<ClassType, string> = { "1A": "H", "2A": "A", "3A": "B", SL: "S", CC: "C", "2S": "D" };
export const DEMO_SEATS_PER_COACH = 12;
export const DEMO_SCHEDULE_DAYS = 14;

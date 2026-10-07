# Rail Reserve System

RAILWAY RESERVATION SYSTEM — COMPLETE FULL-STACK IMPLEMENTATION
You are working as a senior full-stack engineer, database architect, Firebase/Firestore architect, UI/UX designer, and university project mentor.
I am a 3rd-semester B.Tech Computer Science student building a 20-mark academic project.
The project is:
Railway Reservation System
Problem statement:

> Develop a database-driven Railway Reservation System for maintaining train information, stations, routes, schedules, coaches, seats, passengers, ticket reservations, payments, and cancellations. The system should allow users to search trains, check seat availability, book tickets, and manage cancellations efficiently.

I already have/plan to have the frontend in Lovable. Your task is to turn this into a complete working database-driven application, not a static UI prototype.
IMPORTANT:
Do not create fake/static functionality.
Important operations must actually read/write data.
Use Firebase/Firestore as the database architecture.
Keep the code Firebase-ready.
Do NOT hard-code Firebase API keys or secrets.
Do NOT require real railway APIs.
Do NOT integrate real IRCTC.
Do NOT integrate real-money payment gateways.
Payment is an academic simulation only.
I will add/connect my Firebase project configuration and Firebase Authentication separately.
Authentication should therefore be implemented behind a clean service/abstraction so Firebase Authentication can be connected without rewriting the application.
Keep the project understandable for a 3rd-semester B.Tech student.
Do not introduce unnecessary enterprise complexity.
==================================================
TECHNOLOGY STACK
==================================================
Use:
Frontend:
React
TypeScript
Vite
Tailwind CSS
Lucide React icons
Backend/data layer:
Firebase
Cloud Firestore
Firebase Authentication-ready architecture
Firebase SDK
Use reusable service modules for Firestore operations.
Use:
React Router for routing
React Hook Form where useful
Zod or equivalent validation
Recharts for analytics
date-fns where useful
Do not introduce a separate Express server unless absolutely necessary.
The application should be deployable on Vercel.
==================================================
2. CORE ARCHITECTURE
Use this architecture:
React UI
↓
Pages / Components
↓
Hooks
↓
Service Layer
↓
Firebase SDK
↓
Cloud Firestore
Authentication:
React UI
↓
Auth Context / Auth Service
↓
Firebase Authentication
Do NOT put Firestore queries directly inside every UI component.
Create a clean service architecture.
Suggested structure:
src/
components/
pages/
layouts/
hooks/
services/
firebase/
types/
utils/
lib/
contexts/
data/
routes/
==================================================
3. FIREBASE CONFIGURATION
Create a Firebase configuration module such as:
src/firebase/config.ts
Use environment variables.
Expected variables:
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
Do NOT put actual credentials into source code.
Create a clear .env.example file.
Example:
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
==================================================
4. AUTHENTICATION ARCHITECTURE
Prepare the application for Firebase Authentication.
Required:
Registration
Login
Logout
Current user state
Protected routes
Admin routes
Passenger routes
Authentication loading state
Unauthorized page
Session persistence
Use an AuthContext/AuthProvider.
Do not make authentication depend on fake localStorage login.
However, because Firebase credentials may be added later, isolate Firebase authentication logic in:
src/services/auth.service.ts
and/or
src/contexts/AuthContext.tsx
The rest of the application should consume:
useAuth()
rather than directly calling Firebase Authentication everywhere.
User roles:
PASSENGER
ADMIN
Do NOT trust a role supplied by the frontend.
Create a users collection and design the authorization layer so admin access can be checked securely.
Prepare appropriate Firestore security rules.
==================================================
5. FIRESTORE DATA MODEL
Create a practical Firestore architecture.
Use these main collections:
users
passengers
trains
stations
routes
trainRoutes
schedules
coaches
seats
reservations
reservationPassengers
payments
cancellations
auditLogs
Use document IDs as primary identifiers.
Use references/IDs between related documents.
Keep fields consistent.
==================================================
6. USERS COLLECTION
Collection:
users/{userId}
Fields:
id
name
email
phone
role
status
createdAt
updatedAt
role:
PASSENGER
ADMIN
status:
ACTIVE
INACTIVE
Do not store plaintext passwords in Firestore.
Firebase Authentication handles passwords.
==================================================
7. PASSENGERS COLLECTION
Collection:
passengers/{passengerId}
Fields:
id
userId
fullName
dateOfBirth
gender
phone
email
idType
idNumber
createdAt
updatedAt
status
A user can maintain multiple passenger profiles.
Example:
User:
Shahin
Passengers:
Shahin
Father
Mother
Sister
==================================================
8. TRAINS COLLECTION
Collection:
trains/{trainId}
Fields:
id
trainNumber
trainName
trainType
operator
status
createdAt
updatedAt
Example seed/demo data:
12001 - Rajdhani Express
12841 - Coromandel Express
12860 - Gitanjali Express
12302 - Howrah Rajdhani
12723 - Telangana Express
12627 - Karnataka Express
IMPORTANT:
Clearly label these as DEMO/ACADEMIC SEED DATA.
Do not claim connection to real railway systems.
==================================================
9. STATIONS COLLECTION
Collection:
stations/{stationId}
Fields:
id
stationCode
stationName
city
state
status
createdAt
updatedAt
Example demo stations:
NDLS - New Delhi
HWH - Howrah
BZA - Vijayawada
VSKP - Visakhapatnam
BBS - Bhubaneswar
MAS - Chennai Central
SC - Secunderabad
KGP - Kharagpur
HYB - Hyderabad
BPL - Bhopal
==================================================
10. ROUTES COLLECTION
Collection:
routes/{routeId}
Fields:
id
trainId
routeName
status
createdAt
updatedAt
A route belongs to a train.
==================================================
11. TRAIN ROUTES
Collection:
trainRoutes/{trainRouteId}
Fields:
id
routeId
trainId
stationId
sequenceNumber
arrivalTime
departureTime
distanceKm
dayOffset
The sequenceNumber is extremely important.
Example:
1 → Vijayawada
2 → Visakhapatnam
3 → Bhubaneswar
4 → Kharagpur
5 → Howrah
This allows the system to determine whether a source station occurs before a destination station.
==================================================
12. SCHEDULES
Collection:
schedules/{scheduleId}
Fields:
id
trainId
journeyDate
departureDateTime
arrivalDateTime
status
createdAt
updatedAt
status:
SCHEDULED
COMPLETED
CANCELLED
The same train can have schedules for different journey dates.
==================================================
13. COACHES
Collection:
coaches/{coachId}
Fields:
id
trainId
coachNumber
classType
seatCapacity
status
createdAt
updatedAt
classType:
1A
2A
3A
SL
CC
2S
==================================================
14. SEATS
Collection:
seats/{seatId}
Fields:
id
coachId
trainId
coachNumber
seatNumber
seatType
classType
status
createdAt
updatedAt
seatType examples:
LOWER
MIDDLE
UPPER
SIDE_LOWER
SIDE_UPPER
WINDOW
AISLE
Seat status:
ACTIVE
INACTIVE
IMPORTANT:
Seat availability must NOT be stored as a fake number.
Availability must be calculated from actual reservations for the selected journey/schedule.
==================================================
15. RESERVATIONS
Collection:
reservations/{reservationId}
Fields:
id
pnr
userId
scheduleId
trainId
sourceStationId
destinationStationId
journeyDate
totalFare
bookingStatus
paymentStatus
bookingTime
createdAt
updatedAt
bookingStatus:
PENDING
CONFIRMED
CANCELLED
paymentStatus:
PENDING
SUCCESS
FAILED
REFUNDED
PNR must be unique.
Generate a human-readable unique PNR such as:
PNR-20261007-482931
but verify uniqueness before final confirmation.
==================================================
16. RESERVATION PASSENGERS
Collection:
reservationPassengers/{reservationPassengerId}
Fields:
id
reservationId
passengerId
seatId
coachId
coachNumber
seatNumber
classType
passengerNameSnapshot
ageSnapshot
genderSnapshot
fare
status
createdAt
Store passenger snapshots so that historical tickets remain correct even if a passenger profile is later edited.
status:
CONFIRMED
CANCELLED
==================================================
17. PAYMENTS
Collection:
payments/{paymentId}
Fields:
id
reservationId
pnr
transactionId
amount
paymentMethod
paymentStatus
paymentDate
refundAmount
refundStatus
createdAt
updatedAt
paymentMethod:
SIMULATED_UPI
SIMULATED_CARD
SIMULATED_NET_BANKING
Clearly display everywhere relevant:
"Academic Simulation — No real money is processed."
Transaction ID should be unique.
Example:
SIMTXN-20261007-A82K91
==================================================
18. CANCELLATIONS
Collection:
cancellations/{cancellationId}
Fields:
id
reservationId
pnr
reason
cancelledAt
refundAmount
refundStatus
createdAt
refundStatus:
NOT_APPLICABLE
PENDING
PROCESSED
==================================================
19. AUDIT LOGS
Collection:
auditLogs/{auditLogId}
Fields:
id
userId
action
entity
entityId
description
createdAt
Use this for important admin operations such as:
TRAIN_CREATED
TRAIN_UPDATED
TRAIN_DEACTIVATED
STATION_CREATED
ROUTE_UPDATED
SCHEDULE_CREATED
RESERVATION_CANCELLED
==================================================
20. DATABASE RELATIONSHIPS
Implement these logical relationships:
User
↓ 1:N
Passengers
Train
↓ 1:N
Routes
Route
↓ 1:N
TrainRoutes
Station
↓ 1:N
TrainRoutes
Train
↓ 1:N
Schedules
Train
↓ 1:N
Coaches
Coach
↓ 1:N
Seats
User
↓ 1:N
Reservations
Schedule
↓ 1:N
Reservations
Reservation
↓ 1:N
ReservationPassengers
Passenger
↓ 1:N
ReservationPassengers
Reservation
↓ 1:N
Payments
Reservation
↓ 1:1
Cancellations
==================================================
21. FIRESTORE SERVICE LAYER
Create separate services.
Example:
src/services/auth.service.ts
src/services/user.service.ts
src/services/train.service.ts
src/services/station.service.ts
src/services/route.service.ts
src/services/schedule.service.ts
src/services/coach.service.ts
src/services/seat.service.ts
src/services/passenger.service.ts
src/services/reservation.service.ts
src/services/payment.service.ts
src/services/cancellation.service.ts
src/services/analytics.service.ts
src/services/audit.service.ts
Each service should contain Firestore operations.
For example:
train.service.ts
getTrains()
getTrainById()
createTrain()
updateTrain()
deactivateTrain()
searchTrains()
reservation.service.ts
createReservation()
getReservationByPNR()
getUserReservations()
getReservationById()
cancelReservation()
checkSeatAvailability()
generatePNR()
==================================================
22. TRAIN SEARCH
Build a real database-driven train search.
Search form:
From station
To station
Journey date
Class
Validation:
Source required
Destination required
Source != destination
Journey date required
Journey date cannot be invalid/past where inappropriate
Class required
Do NOT hardcode results.
The search logic must:
Find source station.
Find destination station.
Find trains serving both.
Compare trainRoutes.sequenceNumber.
Ensure source sequence < destination sequence.
Find matching schedule.
Determine requested class.
Calculate actual available seats.
Calculate fare.
Return results.
Search result should contain:
Train number
Train name
Source
Destination
Departure
Arrival
Duration
Class
Available seats
Fare
Coach information
==================================================
23. SEAT AVAILABILITY
Do not create fake availability.
Availability should be calculated from:
Total seats
active confirmed reservations for the selected schedule
available seats
When the user chooses a particular class:
Only seats belonging to that class should be considered.
Display:
Available
Occupied
Selected
Seat selection should have a professional visual layout.
Example:
┌──── Coach B1 ────┐
01 🟩 02 🟩
03 🟥 04 🟩
05 🟩 06 🟦
🟩 Available
🟥 Occupied
🟦 Selected
==================================================
24. DOUBLE-BOOKING PREVENTION
This is critical.
Before confirming a booking:
Re-read the requested seat.
Check all active reservations for the same schedule.
Check whether the seat is already assigned.
If occupied, reject the booking.
Otherwise create the reservation.
Where Firestore transactions are appropriate, use Firestore transactions to reduce race conditions.
Never rely only on frontend availability.
==================================================
25. BOOKING WORKFLOW
Implement:
Search
↓
Select train
↓
View details
↓
Select class
↓
Select passengers
↓
Select seats
↓
Validate passengers
↓
Re-check availability
↓
Calculate fare
↓
Create PNR
↓
Create reservation
↓
Simulated payment
↓
Confirm reservation
↓
Show ticket
==================================================
26. FARE CALCULATION
Use a simple academic fare model.
Example base fares can be configured in a utility file.
Example:
1A → ₹2.50/km
2A → ₹1.80/km
3A → ₹1.30/km
SL → ₹0.80/km
CC → ₹1.10/km
2S → ₹0.50/km
Use:
distance × class rate
Add a reasonable fixed service charge if desired.
Clearly document that this is an academic fare calculation and is NOT official railway pricing.
==================================================
27. PNR GENERATION
Create a reusable PNR generator.
Format:
PNR-YYYYMMDD-XXXXXX
Example:
PNR-20261007-381942
Before confirmation:
Check Firestore to ensure the generated PNR does not already exist.
==================================================
28. SIMULATED PAYMENT
Create a realistic payment screen.
Display:
Booking amount
Payment method
Transaction summary
Methods:
UPI
Card
Net Banking
But label:
"SIMULATED ACADEMIC PAYMENT"
Flow:
Payment initiated
↓
Show processing state
↓
Simulate success/failure
↓
Generate transaction ID
↓
Update payment
↓
Update reservation
Provide a clear success screen.
Do not collect or store real card numbers.
If Card is selected, use dummy fields only and explicitly state:
"Demo payment only. Do not enter real card details."
==================================================
29. TICKET
After successful booking display a professional ticket.
Include:
RailReserve
Academic Railway Reservation System
PNR
Train number
Train name
Journey date
From
To
Departure
Arrival
Class
Coach
Seat
Passenger name
Passenger age
Passenger gender
Fare
Payment status
Booking status
Buttons:
Download Ticket
Print Ticket
View My Bookings
Create a printable/downloadable ticket.
==================================================
30. CANCELLATION
Implement cancellation.
User can:
Open My Bookings
↓
Select ticket
↓
Cancel Ticket
↓
View cancellation warning
↓
Confirm cancellation
↓
Enter reason
↓
Calculate refund
↓
Release seat logically
↓
Update reservation
↓
Create cancellation document
↓
Update payment/refund status
Cancellation must change:
reservation.bookingStatus = CANCELLED
reservationPassenger.status = CANCELLED
payment.refundStatus = PROCESSED/PENDING
==================================================
31. REFUND RULE
Use a simple documented academic rule:
More than 48 hours before journey:
Refund = 90%
24–48 hours:
Refund = 75%
Less than 24 hours:
Refund = 50%
After journey starts:
Refund = 0%
Display the calculation clearly.
Example:
Original fare: ₹1,000
Refund percentage: 90%
Refund amount: ₹900
Clearly label this as an academic simulation rule.
==================================================
32. ADMIN DASHBOARD
Create a professional admin dashboard.
Cards:
Total Trains
Total Stations
Active Routes
Today's Bookings
Confirmed Tickets
Cancelled Tickets
Revenue
Pending Payments
Charts:
Bookings by date
Confirmed vs Cancelled
Revenue trend
Popular trains
Popular routes
Class-wise reservations
IMPORTANT:
All statistics must come from Firestore data.
Do not create fake statistics just to make the dashboard look populated.
If there is insufficient data, display a proper empty state.
==================================================
33. ADMIN CRUD
Implement complete admin management.
Trains:
Create
Read
Search
Filter
Edit
Deactivate
Stations:
Create
Read
Search
Filter
Edit
Deactivate
Routes:
Create
Read
Edit
Deactivate
Schedules:
Create
Read
Edit
Cancel/deactivate
Coaches:
Create
Read
Edit
Deactivate
Seats:
Create
Read
Edit
Deactivate
Reservations:
View
Search by PNR
Filter
View details
Cancel where authorized
Passengers:
View
Search
Filter
Payments:
View
Search
Filter
View transaction details
Cancellations:
View
Search
Filter
View refund information
Use confirmation dialogs before destructive operations.
Prefer deactivation over deleting records that are referenced by bookings.
==================================================
34. ADMIN SECURITY
Do not secure admin pages only by hiding the UI.
Implement:
Frontend route protection
AND
Firestore Security Rules
Admin operations must require an authenticated user with ADMIN role.
Never trust:
localStorage.role
URL parameters
frontend-only role state
Prepare Firestore rules accordingly.
==================================================
35. FIRESTORE SECURITY RULES
Create a firestore.rules file.
Rules should conceptually enforce:
Unauthenticated users:
Cannot read/write protected data.
Authenticated passengers:
Can read public train/station/schedule information.
Can read/write their own passenger profiles.
Can read their own reservations.
Can create bookings for themselves.
Cannot modify railway master data.
Cannot modify other users' bookings.
Cannot access admin data.
Admins:
Can manage railway master data.
Can view reservations/payments/cancellations.
Can manage appropriate collections.
Do not use insecure rules such as:
allow read, write: if true;
Never leave the database completely open.
If some rules cannot safely determine ownership because of the current schema, structure the documents/fields so ownership can be validated.
==================================================
36. USER DASHBOARD
Create a polished passenger dashboard.
Show:
Welcome message
Upcoming journey
Latest booking
Booking count
Active tickets
Cancelled tickets
Quick actions:
Search Trains
My Bookings
Passengers
Recent bookings table.
==================================================
37. MY BOOKINGS
Display:
PNR
Train
Journey
Passenger count
Class
Seats
Fare
Payment status
Booking status
Date
Filters:
All
Upcoming
Confirmed
Cancelled
Actions:
View ticket
Print
Download
Cancel
==================================================
38. PROFILE
User can view/edit:
Name
Phone
Email
Email should generally remain controlled by authentication.
Show account role.
==================================================
39. PASSENGER MANAGEMENT
Create a clean passenger profile management screen.
Actions:
Add passenger
Edit passenger
Delete passenger where safe
Use passenger during booking
Fields:
Full name
Date of birth
Gender
Phone
Email
ID type
ID number
Validation is required.
==================================================
40. UI/UX
The application must look like a serious railway reservation portal.
Do NOT make it look like a generic CRUD college project.
Design direction:
Modern
Professional
Clean
Responsive
Railway-inspired
Minimal but polished
Use:
Deep railway-inspired colors
Neutral backgrounds
Clear typography
Rounded cards
Subtle borders
Professional tables
Status badges
Consistent spacing
Lucide icons
Use a responsive sidebar on desktop and mobile navigation/drawer on smaller screens.
==================================================
41. REQUIRED STATES
Every important page must handle:
Loading
Success
Error
Empty
Unauthorized
No search results
Do not leave blank screens.
Examples:
"No trains found for this route and date."
"No bookings yet."
"No cancellation records found."
==================================================
42. NOTIFICATIONS
Use toast notifications for:
Booking successful
Payment successful
Cancellation successful
Train added
Train updated
Station added
Validation errors
Permission denied
Network/database errors
Do not expose raw Firebase errors to the user.
Convert them to understandable messages.
==================================================
43. VALIDATION
Validate on the application/backend/data-operation side.
Important validation:
Source != destination
Valid journey date
Required passenger name
Valid passenger age
Valid gender
Required train
Required schedule
Required class
Valid seat
Seat availability
Valid fare
Valid payment amount
Unique PNR
Unique transaction ID
Only authorized admins can manage master data.
==================================================
44. ERROR HANDLING
Create centralized error handling where practical.
Use meaningful messages:
"Unable to load train information."
"Selected seat is no longer available. Please choose another seat."
"Your session has expired. Please log in again."
"You do not have permission to perform this action."
"Booking could not be completed."
Do not display stack traces to users.
==================================================
45. ANALYTICS
Implement real Firestore-based analytics.
Metrics:
Total bookings
Confirmed bookings
Cancelled bookings
Revenue
Refunds
Popular trains
Popular routes
Class-wise reservations
Daily booking count
Use Recharts.
If the database has no data, display:
"No analytics data available yet."
Do not manufacture statistics.
==================================================
46. DEMO / SEED DATA
Create a seed/demo data utility.
Include realistic academic data:
At least:
10 stations
6 trains
6 routes
multiple route stations
multiple schedules
multiple coaches
multiple seats
Include demo data for:
1A
2A
3A
SL
CC
Use Indian railway-style names and station codes.
Clearly label it:
DEMO DATA
ACADEMIC SIMULATION
Do not claim that the data is live railway data.
==================================================
47. DEMO ADMIN
Prepare the application so that after Firebase Authentication is connected, an authenticated admin account can be assigned:
role = ADMIN
Do not hard-code an admin password.
Create clear documentation explaining how to make an authenticated Firebase user an admin.
Prefer a secure approach rather than exposing an "isAdmin" button to ordinary users.
==================================================
48. API/SERVICE ABSTRACTION
Even though Firestore is being used, keep business logic separated from components.
Example:
Component:
SearchTrainForm.tsx
calls:
trainService.searchTrains()
rather than performing Firestore queries directly.
Booking page calls:
reservationService.createReservation()
Cancellation page calls:
cancellationService.cancelReservation()
Analytics page calls:
analyticsService.getDashboardStats()
This will make the project easy to explain in viva.
==================================================
49. TYPESCRIPT TYPES
Create proper types/interfaces for:
User
Passenger
Train
Station
Route
TrainRoute
Schedule
Coach
Seat
Reservation
ReservationPassenger
Payment
Cancellation
AuditLog
Avoid excessive use of:
any
Use explicit types.
==================================================
50. ROUTING
Create routes such as:
/login
/register
/dashboard
/search
/search/results
/trains/:id
/passengers
/book/:scheduleId
/payment/:reservationId
/booking/success/:pnr
/bookings
/bookings/:pnr
/profile
/admin
/admin/trains
/admin/stations
/admin/routes
/admin/schedules
/admin/coaches
/admin/seats
/admin/passengers
/admin/reservations
/admin/payments
/admin/cancellations
/admin/analytics
==================================================
51. RESPONSIVE DESIGN
Desktop:
Sidebar + content
Tablet:
Collapsible sidebar
Mobile:
Bottom/mobile navigation or drawer
Tables should become horizontally scrollable or card-based where appropriate.
Booking flow must be comfortable on mobile.
==================================================
52. IMPORTANT BUSINESS LOGIC
Implement these rules exactly:
Source and destination cannot be identical.
Source must occur before destination in route sequence.
Journey date must be valid.
A schedule must belong to a valid train.
A coach must belong to a valid train.
A seat must belong to a valid coach.
A confirmed reservation must have a valid schedule.
A seat cannot be confirmed for two passengers for the same schedule.
Cancelled reservations cannot remain active.
Cancellation must release the seat logically.
Payment amount must equal booking fare.
PNR must be unique.
Transaction ID must be unique.
Only authenticated users can book.
Only authorized admins can manage master data.
==================================================
53. TRANSACTION-SAFE BOOKING
This is extremely important.
The booking operation should be treated as a multi-step business transaction.
At minimum:
Re-check seat availability.
Generate/check PNR.
Create reservation.
Create reservation passenger records.
Create payment.
Confirm reservation only after successful simulated payment.
If a critical step fails, do not leave obviously inconsistent booking data.
Use Firestore transactions/batched writes where appropriate.
==================================================
54. DO NOT OVERENGINEER
This is a university project.
Do NOT introduce:
Microservices
Kubernetes
Redis
GraphQL
Kafka
Complex state management unless necessary
Real payment gateways
Real railway APIs
AI features unrelated to the problem
Keep it understandable.
==================================================
55. DOCUMENTATION
Create/update README.md containing:
Project title
Problem statement
Objective
Features
Technology stack
Architecture
Firestore collections
Relationships
Authentication
Booking workflow
Seat allocation logic
Payment simulation
Cancellation/refund logic
Security
Local setup
Firebase setup
Environment variables
Deployment
Demo credentials instructions
Academic limitations
Clearly state:
"This is an academic simulation and is not connected to IRCTC or any real railway reservation/payment infrastructure."
==================================================
56. FIREBASE SETUP DOCUMENTATION
Create:
FIREBASE_SETUP.md
Explain step-by-step:
Create Firebase project.
Enable Authentication.
Enable Email/Password authentication.
Create Firestore database.
Add web application.
Copy Firebase configuration.
Create .env.local.
Add VITE_FIREBASE_* variables.
Deploy Firestore rules.
Add first user.
Assign ADMIN role securely.
Start the application.
Do not include real credentials.
==================================================
57. ENVIRONMENT FILES
Create:
.env.example
Do not create fake secrets that look real.
Do not commit:
.env
.env.local
Update .gitignore appropriately.
==================================================
58. DEVELOPMENT EXPERIENCE
The project must work in VS Code/Cursor.
Ensure:
npm install
npm run dev
works for the frontend.
Do not leave unresolved imports.
Do not leave placeholder functions such as:
TODO
IMPLEMENT HERE
FAKE DATA HERE
for critical features.
==================================================
59. FINAL QUALITY CHECK
Before considering the implementation complete, check:
TypeScript compilation
No broken imports
No obvious runtime errors
No unused critical routes
Responsive UI
Firestore service functions
Authentication abstraction
Protected routes
Admin protection
Booking flow
Seat availability
PNR generation
Simulated payment
Cancellation
Refund calculation
Admin CRUD
Analytics
Firestore security rules
README
Firebase setup documentation
Fix any errors you encounter.
==================================================
60. PRIORITY ORDER
If the implementation is too large to complete in a single operation, prioritize functionality in this exact order:
PRIORITY 1:
Firebase configuration architecture
Authentication abstraction
Firestore service layer
Types
Security rules
PRIORITY 2:
Stations
Trains
Routes
TrainRoutes
Schedules
Coaches
Seats
PRIORITY 3:
Train search
Seat availability
PRIORITY 4:
Passenger management
Booking
PNR
Seat allocation
PRIORITY 5:
Simulated payment
Ticket
PRIORITY 6:
Cancellation
Refund
PRIORITY 7:
Admin dashboard
CRUD
Analytics
PRIORITY 8:
Polish
Responsive UI
Loading states
Error handling
Documentation
==================================================
61. VERY IMPORTANT IMPLEMENTATION RULE
Do NOT simply create UI screens that appear functional.
For every major button:
Create Train
Edit Train
Add Station
Search Train
Check Availability
Book Ticket
Pay
Cancel Ticket
Update Route
Create Schedule
there must be an actual underlying service operation.
If Firebase is not yet configured, structure the code so the UI and services are ready to work immediately once the Firebase environment variables are supplied.
Do not silently replace database functionality with local arrays or permanent mock data.
==================================================
62. FINAL ACCEPTANCE TEST
The finished application should support this complete demonstration:
ADMIN:
Login
↓
Admin Dashboard
↓
Create/view stations
↓
Create/view trains
↓
Create route
↓
Assign stations to route
↓
Create schedule
↓
Create coaches
↓
Create seats
PASSENGER:
Register/Login
↓
Dashboard
↓
Search:
Vijayawada → Howrah
↓
Select date
↓
Select class
↓
View real database results
↓
View available seats
↓
Select passengers
↓
Select seats
↓
Review fare
↓
Simulated payment
↓
Payment success
↓
PNR generated
↓
Ticket displayed
↓
Download/print ticket
↓
My Bookings
↓
Cancel ticket
↓
Refund displayed
↓
Seat becomes available again
ADMIN:
Open dashboard
↓
See updated booking statistics
↓
See confirmed/cancelled statistics
↓
See revenue/refund information
This complete workflow must work using actual Firestore data.
==================================================
63. DESIGN QUALITY
The final application should feel like:
"University Railway Reservation System"
not:
"Basic CRUD College Project"
Use a consistent design system throughout.
Suggested branding:
RAILRESERVE
Subtitle:
University Railway Reservation System
Small disclaimer:
Academic Simulation • Not connected to IRCTC
Use professional railway-themed visuals without copying IRCTC branding.
==================================================
64. FINAL INSTRUCTION TO LOVABLE
Do not stop after generating the UI.
Implement the actual application architecture, Firestore services, data models, business logic, validation, authentication abstraction, security rules, booking flow, payment simulation, cancellation workflow, admin CRUD, analytics, and documentation.
Reuse existing working components where possible.
Do not unnecessarily redesign already working pages.
When modifying an existing feature, preserve its existing functionality unless the change is required for the new architecture.
After implementation, report:
Files created
Files modified
Firebase configuration files
Firestore collections
Security rules
Main service modules
Authentication integration points
Commands needed to run the project
Firebase setup steps still required from me
Any remaining limitations
The goal is a professional, genuinely functional, database-driven academic Railway Reservation System that I can demonstrate confidently in a B.Tech 3rd-semester viva.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f77f0d8e-0057-4479-b74b-7e7b4bcccb12).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

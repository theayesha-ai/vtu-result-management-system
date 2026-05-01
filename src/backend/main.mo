import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";

actor {
  public type USN = Text;
  public type SubjectCode = Text;
  public type Semester = Nat;

  public type Student = {
    usn : USN;
    name : Text;
    dob : Text; // Date of Birth in "YYYY-MM-DD" format
    currentSemester : Semester;
  };

  public type SemesterResult = {
    subjectCode : SubjectCode;
    subjectName : Text;
    internalMarks : Nat; // out of 50
    externalMarks : Nat; // out of 100
    credits : Nat;
    totalMarks : Nat;
    grade : Text;
    gradePoints : Nat;
  };

  public type SemesterResults = {
    semester : Semester;
    results : [SemesterResult];
    sgpa : Float;
  };

  public type StudentResults = {
    student : Student;
    allSemesterResults : [SemesterResults];
    cgpa : Float;
  };

  public type UserProfile = {
    name : Text;
    usn : ?USN; // Optional USN for students
  };

  module Student {
    public func compareByUSN(student1 : Student, student2 : Student) : Order.Order {
      Text.compare(student1.usn, student2.usn);
    };
  };

  let studentsMap = Map.empty<USN, Student>();
  let resultsMap = Map.empty<USN, Map.Map<Semester, Map.Map<SubjectCode, SemesterResult>>>();
  
  // Map Principal to USN for student authentication
  let principalToUSN = Map.empty<Principal, USN>();
  
  // User profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Access to authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Grade Mapping and Calculations
  func calculateGrade(totalMarks : Nat) : (Text, Nat) {
    switch (totalMarks) {
      case (m) {
        if (m >= 90) { ("S", 10) } else if (m >= 80) { ("A", 9) } else if (m >= 70) {
          ("B", 8);
        } else if (m >= 60) { ("C", 7) } else if (m >= 55) { ("D", 6) } else if (m >= 50) {
          ("E", 5);
        } else { ("F", 0) };
      };
    };
  };

  // ── Seed data helpers ──────────────────────────────────────────────────────

  func seedStudent(usn : USN, name : Text, sem : Semester) {
    studentsMap.add(usn, { usn; name; dob = "2006-01-01"; currentSemester = sem });
  };

  func seedResult(usn : USN, sem : Semester, code : SubjectCode, subjectName : Text, internal : Nat, external : Nat, credits : Nat) {
    let total = internal + external;
    let (grade, gradePoints) = calculateGrade(total);
    let result : SemesterResult = { subjectCode = code; subjectName; internalMarks = internal; externalMarks = external; credits; totalMarks = total; grade; gradePoints };
    let semMap = switch (resultsMap.get(usn)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Semester, Map.Map<SubjectCode, SemesterResult>>(); resultsMap.add(usn, m); m };
    };
    let subMap = switch (semMap.get(sem)) {
      case (?m) { m };
      case (null) { let m = Map.empty<SubjectCode, SemesterResult>(); semMap.add(sem, m); m };
    };
    subMap.add(code, result);
  };

  // ── CI batch — Semester 3 (high marks for high CGPA) ──────────────────────

  do {
    // 1) 4MO24CI001 — Aditiya ks
    let u1 = "4MO24CI001";
    seedStudent(u1, "Aditiya ks", 3);
    seedResult(u1, 3, "BMATCS301", "Engineering Mathematics-III", 48, 44, 4);
    seedResult(u1, 3, "BCS302",    "Data Structures and Algorithms", 47, 46, 4);
    seedResult(u1, 3, "BCS303",    "Database Management Systems", 49, 45, 4);
    seedResult(u1, 3, "BCS304",    "Computer Networks", 48, 43, 3);
    seedResult(u1, 3, "BCSL305",   "DSA Lab", 48, 48, 2);
    seedResult(u1, 3, "BSCK307",   "Social Connect and Responsibility", 95, 0, 1);
    seedResult(u1, 3, "BNSK359",   "National Service Scheme", 95, 0, 1);
    seedResult(u1, 3, "BCS358A",   "Python Programming", 49, 47, 2);
    seedResult(u1, 3, "BCS306C",   "Operating Systems", 48, 44, 3);

    // 2) 4MO24CI002 — Afza Fathima (~6.0 CGPA — low marks, borderline passing)
    let u2 = "4MO24CI002";
    seedStudent(u2, "Afza Fathima", 3);
    seedResult(u2, 3, "BMATCS301", "Engineering Mathematics-III", 22, 28, 4);
    seedResult(u2, 3, "BCS302",    "Data Structures and Algorithms", 20, 30, 4);
    seedResult(u2, 3, "BCS303",    "Database Management Systems", 25, 27, 4);
    seedResult(u2, 3, "BCS304",    "Computer Networks", 18, 32, 3);
    seedResult(u2, 3, "BCSL305",   "DSA Lab", 28, 22, 2);
    seedResult(u2, 3, "BSCK307",   "Social Connect and Responsibility", 52, 0, 1);
    seedResult(u2, 3, "BNSK359",   "National Service Scheme", 55, 0, 1);
    seedResult(u2, 3, "BCS358A",   "Python Programming", 24, 26, 2);
    seedResult(u2, 3, "BCS306C",   "Operating Systems", 20, 30, 3);

    // 3) 4MO24CI003 — Ankita BT (~8.5 CGPA — decent marks, totals 65-78)
    let u3 = "4MO24CI003";
    seedStudent(u3, "Ankita bt", 3);
    seedResult(u3, 3, "BMATCS301", "Engineering Mathematics-III", 35, 33, 4);
    seedResult(u3, 3, "BCS302",    "Data Structures and Algorithms", 38, 40, 4);
    seedResult(u3, 3, "BCS303",    "Database Management Systems", 40, 38, 4);
    seedResult(u3, 3, "BCS304",    "Computer Networks", 36, 32, 3);
    seedResult(u3, 3, "BCSL305",   "DSA Lab", 38, 35, 2);
    seedResult(u3, 3, "BSCK307",   "Social Connect and Responsibility", 78, 0, 1);
    seedResult(u3, 3, "BNSK359",   "National Service Scheme", 75, 0, 1);
    seedResult(u3, 3, "BCS358A",   "Python Programming", 39, 37, 2);
    seedResult(u3, 3, "BCS306C",   "Operating Systems", 37, 35, 3);

    // 4) 4MO24CI004 — Ankita B
    let u4 = "4MO24CI004";
    seedStudent(u4, "Ankita b", 3);
    seedResult(u4, 3, "BMATCS301", "Engineering Mathematics-III", 47, 44, 4);
    seedResult(u4, 3, "BCS302",    "Data Structures and Algorithms", 48, 47, 4);
    seedResult(u4, 3, "BCS303",    "Database Management Systems", 50, 46, 4);
    seedResult(u4, 3, "BCS304",    "Computer Networks", 47, 45, 3);
    seedResult(u4, 3, "BCSL305",   "DSA Lab", 48, 49, 2);
    seedResult(u4, 3, "BSCK307",   "Social Connect and Responsibility", 95, 0, 1);
    seedResult(u4, 3, "BNSK359",   "National Service Scheme", 96, 0, 1);
    seedResult(u4, 3, "BCS358A",   "Python Programming", 49, 48, 2);
    seedResult(u4, 3, "BCS306C",   "Operating Systems", 48, 43, 3);

    // 5) 4MO24CI005 — Bibi Ayesha (~7.0 CGPA — lower marks, totals 55-65)
    let u5 = "4MO24CI005";
    seedStudent(u5, "Bibi Ayesha", 3);
    seedResult(u5, 3, "BMATCS301", "Engineering Mathematics-III", 28, 30, 4);
    seedResult(u5, 3, "BCS302",    "Data Structures and Algorithms", 30, 32, 4);
    seedResult(u5, 3, "BCS303",    "Database Management Systems", 32, 28, 4);
    seedResult(u5, 3, "BCS304",    "Computer Networks", 27, 30, 3);
    seedResult(u5, 3, "BCSL305",   "DSA Lab", 33, 27, 2);
    seedResult(u5, 3, "BSCK307",   "Social Connect and Responsibility", 64, 0, 1);
    seedResult(u5, 3, "BNSK359",   "National Service Scheme", 62, 0, 1);
    seedResult(u5, 3, "BCS358A",   "Python Programming", 31, 29, 2);
    seedResult(u5, 3, "BCS306C",   "Operating Systems", 28, 32, 3);

    // 6) 4MO24CI006 — Deepika C
    let u6 = "4MO24CI006";
    seedStudent(u6, "Deepika c", 3);
    seedResult(u6, 3, "BMATCS301", "Engineering Mathematics-III", 47, 45, 4);
    seedResult(u6, 3, "BCS302",    "Data Structures and Algorithms", 48, 47, 4);
    seedResult(u6, 3, "BCS303",    "Database Management Systems", 49, 48, 4);
    seedResult(u6, 3, "BCS304",    "Computer Networks", 48, 46, 3);
    seedResult(u6, 3, "BCSL305",   "DSA Lab", 50, 49, 2);
    seedResult(u6, 3, "BSCK307",   "Social Connect and Responsibility", 95, 0, 1);
    seedResult(u6, 3, "BNSK359",   "National Service Scheme", 96, 0, 1);
    seedResult(u6, 3, "BCS358A",   "Python Programming", 50, 47, 2);
    seedResult(u6, 3, "BCS306C",   "Operating Systems", 48, 45, 3);

    // 7) 4MO24CI007 — Divya B
    let u7 = "4MO24CI007";
    seedStudent(u7, "Divya b", 3);
    seedResult(u7, 3, "BMATCS301", "Engineering Mathematics-III", 49, 47, 4);
    seedResult(u7, 3, "BCS302",    "Data Structures and Algorithms", 50, 48, 4);
    seedResult(u7, 3, "BCS303",    "Database Management Systems", 49, 49, 4);
    seedResult(u7, 3, "BCS304",    "Computer Networks", 48, 46, 3);
    seedResult(u7, 3, "BCSL305",   "DSA Lab", 50, 50, 2);
    seedResult(u7, 3, "BSCK307",   "Social Connect and Responsibility", 96, 0, 1);
    seedResult(u7, 3, "BNSK359",   "National Service Scheme", 95, 0, 1);
    seedResult(u7, 3, "BCS358A",   "Python Programming", 50, 49, 2);
    seedResult(u7, 3, "BCS306C",   "Operating Systems", 49, 47, 3);

    // 8) 4MN24CI002 — Ameen Baig (~7.2 CGPA — mixed marks, totals 57-70)
    let u8 = "4MN24CI002";
    seedStudent(u8, "Ameen baig", 3);
    seedResult(u8, 3, "BMATCS301", "Engineering Mathematics-III", 30, 32, 4);
    seedResult(u8, 3, "BCS302",    "Data Structures and Algorithms", 32, 30, 4);
    seedResult(u8, 3, "BCS303",    "Database Management Systems", 35, 35, 4);
    seedResult(u8, 3, "BCS304",    "Computer Networks", 28, 32, 3);
    seedResult(u8, 3, "BCSL305",   "DSA Lab", 36, 30, 2);
    seedResult(u8, 3, "BSCK307",   "Social Connect and Responsibility", 68, 0, 1);
    seedResult(u8, 3, "BNSK359",   "National Service Scheme", 65, 0, 1);
    seedResult(u8, 3, "BCS358A",   "Python Programming", 33, 34, 2);
    seedResult(u8, 3, "BCS306C",   "Operating Systems", 30, 30, 3);
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Student Authentication - Login with USN + Name
  public shared ({ caller }) func studentLogin(usn : USN, name : Text) : async Bool {
    switch (studentsMap.get(usn)) {
      case (null) { Runtime.trap("Invalid credentials") };
      case (?student) {
        if (student.name.toLower() != name.toLower()) {
          Runtime.trap("Invalid credentials");
        };
        
        // Link this principal to the USN
        principalToUSN.add(caller, usn);
        
        // Assign user role if not already assigned
        if (AccessControl.getUserRole(accessControlState, caller) == #guest) {
          AccessControl.assignRole(accessControlState, caller, caller, #user);
        };
        
        // Create/update user profile
        userProfiles.add(caller, {
          name = student.name;
          usn = ?usn;
        });
        
        true;
      };
    };
  };

  // Helper function to check if caller is authorized to view student data
  func isAuthorizedToViewStudent(caller : Principal, usn : USN) : Bool {
    // Admin can view any student
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    
    // Student can view their own data
    switch (principalToUSN.get(caller)) {
      case (?studentUSN) { studentUSN == usn };
      case (null) { false };
    };
  };

  func calculateSgpa(semesterResults : [SemesterResult]) : Float {
    var totalPoints : Nat = 0;
    var totalCredits : Nat = 0;

    for (result in semesterResults.values()) {
      totalPoints += result.gradePoints * result.credits;
      totalCredits += result.credits;
    };

    if (totalCredits == 0) { return 0.0 };

    totalPoints.toFloat() / totalCredits.toFloat();
  };

  func calculateCgpa(allSgpas : [Float]) : Float {
    if (allSgpas.size() == 0) { return 0.0 };

    var total : Float = 0.0;
    for (sgpa in allSgpas.values()) {
      total += sgpa;
    };

    total / allSgpas.size().toInt().toFloat();
  };

  // Student Management (Admin only)
  public shared ({ caller }) func addStudent(student : Student) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin privileges required");
    };

    if (studentsMap.containsKey(student.usn)) {
      Runtime.trap("Student already exists");
    };

    studentsMap.add(student.usn, student);
  };

  public shared ({ caller }) func updateStudent(student : Student) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin privileges required");
    };

    if (not (studentsMap.containsKey(student.usn))) {
      Runtime.trap("Student does not exist");
    };

    studentsMap.add(student.usn, student);
  };

  public shared ({ caller }) func deleteStudent(usn : USN) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin privileges required");
    };

    if (not (studentsMap.containsKey(usn))) {
      Runtime.trap("Student does not exist");
    };

    studentsMap.remove(usn);
    resultsMap.remove(usn);
    
    // Clean up principal mapping if exists
    for ((principal, studentUSN) in principalToUSN.entries()) {
      if (studentUSN == usn) {
        principalToUSN.remove(principal);
      };
    };
  };

  public query ({ caller }) func getAllStudents() : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin privileges required");
    };

    studentsMap.values().toArray().sort(Student.compareByUSN);
  };

  // Marks Management (Admin only)
  public shared ({ caller }) func addOrUpdateResult(usn : USN, semester : Semester, subjectCode : SubjectCode, subjectName : Text, internalMarks : Nat, externalMarks : Nat, credits : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin privileges required");
    };

    if (not (studentsMap.containsKey(usn))) {
      Runtime.trap("Student does not exist");
    };

    if (internalMarks > 50 or externalMarks > 100) {
      Runtime.trap("Invalid marks: Internal(max 50), External(max 100)");
    };

    let totalMarks = internalMarks + externalMarks;
    let (grade, gradePoints) = calculateGrade(totalMarks);

    let result : SemesterResult = {
      subjectCode;
      subjectName;
      internalMarks;
      externalMarks;
      credits;
      totalMarks;
      grade;
      gradePoints;
    };

    let semesterResults = switch (resultsMap.get(usn)) {
      case (?s) { s };
      case (null) {
        let newMap = Map.empty<Semester, Map.Map<SubjectCode, SemesterResult>>();
        resultsMap.add(usn, newMap);
        newMap;
      };
    };

    let subjectResults = switch (semesterResults.get(semester)) {
      case (?sr) { sr };
      case (null) {
        let newMap = Map.empty<SubjectCode, SemesterResult>();
        semesterResults.add(semester, newMap);
        newMap;
      };
    };

    subjectResults.add(subjectCode, result);
  };

  public shared ({ caller }) func deleteResult(usn : USN, semester : Semester, subjectCode : SubjectCode) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin privileges required");
    };

    switch (resultsMap.get(usn)) {
      case (null) { Runtime.trap("Student results not found") };
      case (?semesterResults) {
        switch (semesterResults.get(semester)) {
          case (null) {
            Runtime.trap("Subject results for semester " # semester.toText() # " not found");
          };
          case (?subjectResults) {
            if (not (subjectResults.containsKey(subjectCode))) {
              Runtime.trap("Subject not found");
            };
            subjectResults.remove(subjectCode);
          };
        };
      };
    };
  };

  // Query APIs (with authorization)
  public query ({ caller }) func getStudentResults(usn : USN) : async StudentResults {
    if (not (isAuthorizedToViewStudent(caller, usn))) {
      Runtime.trap("Unauthorized: You can only view your own results");
    };

    let student = switch (studentsMap.get(usn)) {
      case (null) { Runtime.trap("Student not found") };
      case (?s) { s };
    };

    let semesterResults = switch (resultsMap.get(usn)) {
      case (null) { Map.empty<Semester, Map.Map<SubjectCode, SemesterResult>>() };
      case (?sr) { sr };
    };

    var allResults : [SemesterResults] = [];
    var allSgpas : [Float] = [];

    for ((sem, subjectResults) in semesterResults.entries()) {
      let resultsArray = subjectResults.values().toArray();
      let sgpa = calculateSgpa(resultsArray);

      allResults := allResults.concat([{
        semester = sem;
        results = resultsArray;
        sgpa;
      }]);
      allSgpas := allSgpas.concat([sgpa]);
    };

    let cgpa = calculateCgpa(allSgpas);

    {
      student;
      allSemesterResults = allResults;
      cgpa;
    };
  };

  public query ({ caller }) func getSemesterResults(usn : USN, semester : Semester) : async SemesterResults {
    if (not (isAuthorizedToViewStudent(caller, usn))) {
      Runtime.trap("Unauthorized: You can only view your own results");
    };

    switch (resultsMap.get(usn)) {
      case (null) { Runtime.trap("Student results not found") };
      case (?semesterResults) {
        switch (semesterResults.get(semester)) {
          case (null) { Runtime.trap("Semester results not found") };
          case (?subjectResults) {
            let resultsArray = subjectResults.values().toArray();
            let sgpa = calculateSgpa(resultsArray);

            {
              semester;
              results = resultsArray;
              sgpa;
            };
          };
        };
      };
    };
  };
};

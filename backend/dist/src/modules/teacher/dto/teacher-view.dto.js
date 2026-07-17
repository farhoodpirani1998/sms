"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTeacherProfileView = toTeacherProfileView;
exports.toTeacherAssignmentView = toTeacherAssignmentView;
exports.toTeacherListItemView = toTeacherListItemView;
function toTeacherProfileView(user, assignments) {
    return {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        schoolId: user.schoolId,
        isActive: user.isActive,
        assignments: assignments.map((a) => ({
            id: a.id,
            gradeId: a.gradeId,
            gradeTitle: a.grade?.title,
            subjectId: a.subjectId,
            subjectTitle: a.subject?.title,
        })),
    };
}
function toTeacherAssignmentView(assignment) {
    return {
        id: assignment.id,
        teacherId: assignment.teacherId,
        teacherName: assignment.teacher?.fullName,
        gradeId: assignment.gradeId,
        gradeTitle: assignment.grade?.title,
        subjectId: assignment.subjectId,
        subjectTitle: assignment.subject?.title,
        createdAt: assignment.createdAt,
    };
}
function toTeacherListItemView(user) {
    return {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        isActive: user.isActive,
    };
}
//# sourceMappingURL=teacher-view.dto.js.map
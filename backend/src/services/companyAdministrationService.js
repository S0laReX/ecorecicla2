const Notice=require('../models/Notice');
const { pool } = require('../config/database');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const CompanyVerificationDecision = require('../models/CompanyVerificationDecision');
const CustomModelError = require('../utils/customModelError');
const { lockSessionUser } = require('./sessionPolicy');
const { transaction } = require('./transactionService');
const { uuidSchema } = require('../schemas/publicationSchema');
const { AuditService } = require('./auditService');
const { LogCategory } = require('../utils/logCategories');
const source = 'companyAdministrationService.js';
/** REQUIRE ADMINISTRATOR @param {import('./sessionPolicy').AuthContext} auth @param {import('mysql2/promise').PoolConnection} connection */
async function requireAdministrator(auth, connection) {
    const user = await lockSessionUser(auth, connection);
    if (user.userRoleCode !== 'ADMIN') throw new CustomModelError('User', 'No tienes permiso para administrar empresas.', 'ROLE_FORBIDDEN', 403);
    return user;
}
/** LIST PENDING COMPANY APPLICATIONS @param {import('./sessionPolicy').AuthContext} auth @param {number} page @param {number} limit @param {string} search */
async function listPendingCompanyApplications(auth, page, limit, search = '') {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction(); const administrator = await requireAdministrator(auth, connection);
        const total = await CompanyProfile.readPendingCount(search, connection); const companies = await CompanyProfile.findPending(search, page, limit, connection);
        await connection.commit(); await AuditService.logSensitiveDataAccess(administrator.userUUID, 'pending-company-applications', null, { count: companies.length });
        return { companies, meta: { total, page, limit } };
    } catch (error) {
        try { await connection.rollback(); } catch { await AuditService.logSystem(LogCategory.STABILITY, 'ERROR', 'Company list rollback failed', source, 'listPendingCompanyApplications', null); } throw error;
    } finally { connection.release(); }
}
/** RETRIEVE PRIVATE PENDING COMPANY DOCUMENT @param {import('./sessionPolicy').AuthContext} auth @param {string} companyUUID */
async function retrievePendingCompanyDocument(auth, companyUUID) {
    if (!uuidSchema.safeParse(companyUUID).success) throw new CustomModelError('CompanyProfile', 'Solicitud no encontrada.', 'COMPANY_NOT_FOUND', 404);
    const document = await transaction(async connection => {
        const administrator = await requireAdministrator(auth, connection); const profile = await CompanyProfile.findPendingDocumentByUUID(companyUUID, connection);
        if (!profile) throw new CustomModelError('CompanyProfile', 'Solicitud no encontrada.', 'COMPANY_NOT_FOUND', 404);
        return { document: profile, administratorUUID: administrator.userUUID };
    });
    await AuditService.logSensitiveDataAccess(document.administratorUUID, 'company-verification-document', null, { companyUUID });
    return document.document;
}
/** DECIDE COMPANY VERIFICATION @param {import('./sessionPolicy').AuthContext} auth @param {string} companyUUID @param {{decision:'APPROVED'|'REJECTED',reason:string|null}} input */
async function decideCompanyVerification(auth, companyUUID, input) {
    if (!uuidSchema.safeParse(companyUUID).success) throw new CustomModelError('CompanyProfile', 'Solicitud no encontrada.', 'COMPANY_NOT_FOUND', 404);
    const result = await transaction(async connection => {
        const administrator = await requireAdministrator(auth, connection);
        const profile = await CompanyProfile.findPendingByUUIDForUpdate(companyUUID, connection);
        if (!profile) throw new CustomModelError('CompanyProfile', 'La solicitud no está pendiente o no existe.', 'COMPANY_DECISION_CONFLICT', 409);
        await User.updateCompanyVerificationStatus(profile.companyUserId, input.decision, connection);
        const decisionAt = await CompanyVerificationDecision.create({ companyUserId: profile.companyUserId, adminUserId: administrator.userId, decision: input.decision, reason: input.reason }, connection);
        await Notice.create({recipientUserId:profile.companyUserId,kind:input.decision,eventUUID:companyUUID,title:input.decision==='APPROVED'?'Tu empresa fue aprobada':'Tu solicitud fue rechazada',body:input.decision==='APPROVED'?'Ya puedes acceder a las funciones de recolección.':(input.reason||'Tu solicitud no fue aprobada.')},connection);
        return { companyUUID, verificationStatus: input.decision, decisionAt: new Date(decisionAt).toISOString(), administratorUUID: administrator.userUUID };
    });
    await AuditService.logUserActivity(result.administratorUUID, 'company-verification-decision', { companyUUID, decision: result.verificationStatus });
    return { companyUUID: result.companyUUID, verificationStatus: result.verificationStatus, decisionAt: result.decisionAt };
}
module.exports = { listPendingCompanyApplications, retrievePendingCompanyDocument, decideCompanyVerification };

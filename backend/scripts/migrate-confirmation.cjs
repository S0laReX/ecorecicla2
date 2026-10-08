const fs=require('node:fs');const path=require('node:path');
const {reservationExpiry}=require('../src/utils/availabilityWindow');
/** Additive, repeatable upgrade from US8, including its existing active reservations. */
module.exports=async function migrateConfirmation(connection){
 const [columns]=await connection.execute('SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',['CollectionReservation','expiresAt']);
 if(!columns.length)await connection.query(fs.readFileSync(path.join(__dirname,'../../database/005_collection_confirmation.sql'),'utf8'));
 const [rows]=await connection.execute('SELECT C.id,C.scheduledAt,P.availabilityText FROM CollectionReservation C JOIN Publication P ON P.id=C.publicationId WHERE C.expiresAt IS NULL AND C.status=?',['ACEPTADA']);
 const changes=rows.map(row=>({id:row.id,expiresAt:reservationExpiry(row.availabilityText,new Date(row.scheduledAt))}));
 if(changes.some(row=>!row.expiresAt))throw new Error('Hay reservas antiguas con horarios inválidos; revisarlas antes de habilitar confirmación.');
 for(const row of changes)await connection.execute('UPDATE CollectionReservation SET expiresAt=? WHERE id=? AND expiresAt IS NULL',[row.expiresAt,row.id]);
};

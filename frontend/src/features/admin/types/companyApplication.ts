export interface CompanyApplication {
 companyUUID:string;
 companyName:string;
 companyEmail:string;
 companyTaxIdentifier:string;
 companyContactName:string;
 companyCoverageArea:string;
 companyVerificationStatus:'PENDING';
 companyCreatedAt:string;
}
export interface CompanyApplicationPage {
 companies:CompanyApplication[];
 meta:{total:number;page:number;limit:number};
}
export interface CompanyDecision {
 companyUUID:string;
 verificationStatus:'APPROVED'|'REJECTED';
 decisionAt:string;
}

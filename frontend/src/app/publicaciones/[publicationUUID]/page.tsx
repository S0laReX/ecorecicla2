import {PublicationDetailPage} from '../../../features/publications/pages/PublicationDetailPage';
export default async function Page({params}:{params:Promise<{publicationUUID:string}>}){const {publicationUUID}=await params;return <PublicationDetailPage uuid={publicationUUID}/>;}

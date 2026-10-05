import {EditPublicationPage} from '../../../../features/publications/pages/EditPublicationPage';
export default async function Page({params}:{params:Promise<{publicationUUID:string}>}){const {publicationUUID}=await params;return <EditPublicationPage uuid={publicationUUID}/>;}

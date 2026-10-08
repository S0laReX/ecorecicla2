import {AvailablePublicationDetailPage} from '../../../features/collections/pages/AvailablePublicationDetailPage';
export default async function Page({params}:{params:Promise<{publicationUUID:string}>}){
 const {publicationUUID}=await params;
 return <AvailablePublicationDetailPage uuid={publicationUUID}/>;
}

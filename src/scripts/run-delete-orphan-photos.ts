import "dotenv/config";
import deleteOrphanPhotos from "./functions/delete-orphan-photos";

deleteOrphanPhotos().catch(console.error);

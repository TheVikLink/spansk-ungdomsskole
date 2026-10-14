// The platform injects general project credentials. The scheduler does not use
// them; remove them from its transient environment before loading job libraries.
export const platformAdministrationKeys=['SUPABASE_DB_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SECRET_KEYS'];
export function discardPlatformAdministration(environment){
 for(const key of platformAdministrationKeys)environment.delete(key);
 if(platformAdministrationKeys.some(key=>environment.has(key)))throw Error('Scheduler administrator environment could not be removed');
 return true;
}

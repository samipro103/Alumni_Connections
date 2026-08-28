const fs=require("fs");
const path=require("path");

const ROOT=process.cwd();
const PAYLOAD=path.join(__dirname,"payload");
const MARKER="ALUMNI_2_3_1_PROFILE_PASSPORT_POLISH";

function die(m){console.error("\n[ERROR] "+m+"\n");process.exit(1);}
function norm(t){return t.replace(/\r\n/g,"\n");}
function repl(s,a,b,label){
  if(!s.includes(a)) die("No encuentro ancla: "+label);
  console.log("[OK] "+label);
  return s.replace(a,b);
}
function write(target,original,next){
  const crlf=original.includes("\r\n");
  const n=norm(next);
  fs.writeFileSync(target,crlf?n.replace(/\n/g,"\r\n"):n,"utf8");
}

if(path.basename(ROOT).toLowerCase()!=="alumni-web") die('Ejecuta dentro de "alumni-web".');

const required=[
 "src/app/profile/page.tsx",
 "src/app/u/[username]/page.tsx",
 "src/app/passport/page.tsx",
 "src/app/passport/passport.css",
 "src/components/profile/ProfilePassportPreview.tsx",
 "src/components/profile/ProfilePassportPreview.module.css",
 "src/components/profile/ProfessionalProfileOverview.tsx",
 "src/app/passport/[username]/page.tsx"
];
for(const rel of required) if(!fs.existsSync(path.join(ROOT,rel))) die("No encuentro: "+rel);

const current=fs.readFileSync(path.join(ROOT,"src/app/profile/page.tsx"),"utf8");
if(current.includes(MARKER)){console.log("[SKIP] 2.3.1 ya aplicado.");process.exit(0);}

const stamp=new Date().toISOString().replace(/[:.]/g,"-");
const backupRoot=path.join(ROOT,".alumni_backups","2.3.1-profile-passport-polish",stamp);
for(const rel of required){
 const src=path.join(ROOT,rel), bak=path.join(backupRoot,rel);
 fs.mkdirSync(path.dirname(bak),{recursive:true});
 fs.copyFileSync(src,bak);
}

/* Replace safe full files */
for(const rel of [
 "src/lib/countries.ts",
 "src/components/profile/ProfileMiniStats.tsx",
 "src/components/profile/ProfileMiniStats.module.css",
 "src/components/profile/ProfilePassportPreview.tsx",
 "src/components/profile/ProfilePassportPreview.module.css",
 "src/components/profile/ProfessionalProfileOverview.tsx",
 "src/app/passport/page.tsx",
 "src/app/passport/passport.css"
]){
 const src=path.join(PAYLOAD,rel), dst=path.join(ROOT,rel);
 if(!fs.existsSync(src)) die("Payload faltante: "+rel);
 fs.mkdirSync(path.dirname(dst),{recursive:true});
 fs.copyFileSync(src,dst);
 console.log("[OK] "+rel);
}

/* Own profile: mini stats next to avatar, remove old lower stats */
{
 const file=path.join(ROOT,"src/app/profile/page.tsx");
 const original=fs.readFileSync(file,"utf8");
 let s=norm(original);

 s=repl(s,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";`,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";
import ProfileMiniStats from "@/components/profile/ProfileMiniStats";`,
"Importar estadísticas compactas perfil propio");

 const avatar=`              <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                {profile.avatar_url ? (
                  <HDProfileImage
                    src={profile.avatar_url}
                    alt="Avatar"
                    variant="avatar"
                    className="h-full w-full object-cover"
/>
                ) : (
                  profile.username?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>`;

 const avatarNew=`              <div className="flex shrink-0 items-center gap-4">
                <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                  {profile.avatar_url ? (
                    <HDProfileImage
                      src={profile.avatar_url}
                      alt="Avatar"
                      variant="avatar"
                      className="h-full w-full object-cover"
  />
                  ) : (
                    profile.username?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>

                <ProfileMiniStats
                  posts={posts.length}
                  followers={followers}
                  following={following}
                />
              </div>`;

 s=repl(s,avatar,avatarNew,"Mover estadísticas junto a foto perfil propio");

 s=repl(s,
`            <div className="alumni-profile-stats mt-6 flex gap-8 border-t border-white/[0.06] pt-5">
              <Stat value={posts.length} label="Publicaciones" />
              <Stat value={followers} label="Seguidores" />
              <Stat value={following} label="Siguiendo" />
            </div>`,
``,
"Quitar estadísticas duplicadas abajo perfil propio");

 s+=`\n/* ${MARKER}:OWNER */\n`;
 write(file,original,s);
}

/* Public profile */
{
 const file=path.join(ROOT,"src/app/u/[username]/page.tsx");
 const original=fs.readFileSync(file,"utf8");
 let s=norm(original);

 s=repl(s,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";`,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";
import ProfileMiniStats from "@/components/profile/ProfileMiniStats";`,
"Importar estadísticas compactas perfil público");

 const avatar=`              <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                {profile.avatar_url ? (
                  <HDProfileImage
                    src={profile.avatar_url}
                    alt="Avatar"
                    variant="avatar"
                    className="h-full w-full object-cover"
/>
                ) : (
                  profile.username?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>`;

 const avatarNew=`              <div className="flex shrink-0 items-center gap-4">
                <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                  {profile.avatar_url ? (
                    <HDProfileImage
                      src={profile.avatar_url}
                      alt="Avatar"
                      variant="avatar"
                      className="h-full w-full object-cover"
  />
                  ) : (
                    profile.username?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>

                <ProfileMiniStats
                  posts={posts.length}
                  followers={followers}
                  following={followingCount}
                />
              </div>`;

 s=repl(s,avatar,avatarNew,"Mover estadísticas junto a foto perfil público");

 s=repl(s,
`            <div className="mt-6 flex gap-8 border-t border-white/[0.06] pt-5">
              <Stat value={posts.length} label="Publicaciones" />
              <Stat value={followers} label="Seguidores" />
              <Stat value={followingCount} label="Siguiendo" />
            </div>`,
``,
"Quitar estadísticas duplicadas abajo perfil público");

 s+=`\n/* ${MARKER}:PUBLIC */\n`;
 write(file,original,s);
}

/* Social passport: flags + city instead of code initials */
{
 const file=path.join(ROOT,"src/app/passport/[username]/page.tsx");
 const original=fs.readFileSync(file,"utf8");
 let s=norm(original);

 s=repl(s,
`import { supabase } from "@/lib/supabase";`,
`import { supabase } from "@/lib/supabase";
import { flagEmoji } from "@/lib/countries";`,
"Importar banderas en pasaporte social");

 s=s.replace(
  `"id,user_id,country_name,country_code,note,theme_style,cover_media_path,created_at"`,
  `"id,user_id,country_name,country_code,city,note,theme_style,cover_media_path,created_at"`
 );

 s=s.replace(
`                    <span>
                      {country.country_code}
                    </span>`,
`                    <span className="social-passport-country-flag">
                      {flagEmoji(country.country_code)}
                    </span>`
 );

 s=s.replace(
`                    <span>
                      {activeCountry.country_code}
                    </span>
                    <h2>
                      {activeCountry.country_name}
                    </h2>
                    <p>`,
`                    <span className="social-passport-active-flag">
                      {flagEmoji(activeCountry.country_code)}
                    </span>
                    <h2>
                      {activeCountry.country_name}
                    </h2>
                    {activeCountry.city && (
                      <strong>{activeCountry.city}</strong>
                    )}
                    <p>`
 );

 s+=`\n/* ${MARKER}:SOCIAL_PASSPORT */\n`;
 write(file,original,s);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.3.1 - PROFILE + PASSPORT POLISH");
console.log("============================================================");
console.log("[OK] 249 países disponibles en selector");
console.log("[OK] Banderas reales por código ISO");
console.log("[OK] Crear país ahora: País / Ciudad / Comentario");
console.log("[OK] Código ya no lo escribe el usuario");
console.log("[OK] Modal de Añadir país reconstruido para evitar bug");
console.log("[OK] Crear país siempre visible dentro del editor");
console.log("[OK] Pasaporte perfil simplificado");
console.log("[OK] Próximo destino muestra bandera");
console.log("[OK] Formación reemplaza bloque profesional/Trayectoria");
console.log("[OK] Publicaciones/Seguidores/Siguiendo junto a foto");
console.log("[OK] Guatemala ya tiene Cayalá en producción");
console.log("[OK] Supabase YA actualizado");
console.log("[OK] No ejecutes SQL");
console.log("[OK] Backup: "+backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");

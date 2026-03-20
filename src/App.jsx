import { useState, useCallback, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc,
  query, where, arrayUnion, getDocs, addDoc, serverTimestamp
} from "firebase/firestore";
import AuthScreen from "./AuthScreen";

const LANGUAGES = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "pt", flag: "🇧🇷", label: "Português" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
];

const T = {
  fr: { appTitle:"SplitEasy",rtl:false,groups:"Mes groupes",newGroup:"Nouveau groupe",groupNamePH:"Nom du groupe...",create:"Créer",cancel:"Annuler",back:"← Groupes",noGroups:"Aucun groupe. Créez-en un !",members:"Membres",memberPH:"Prénom...",add:"Ajouter",expenses:"Dépenses",balances:"Balances",descPH:"Description...",amountPH:"Montant (€)",paidBy:"Payé par",splitAmong:"Répartir entre",each:"chacun",save:"Enregistrer",owes:"doit",to:"à",settled:"Tout est réglé ! 🎉",noExpenses:"Aucune dépense.",noMembers:"Ajoutez des membres.",total:"Total",membersCount:"membres",expensesCount:"dépenses",edit:"Modifier",delete:"Supprimer",confirmDeleteTitle:"Supprimer définitivement ?",confirmDeleteExp:"Cette dépense sera supprimée définitivement.",confirmDeleteMember:"Ce membre sera retiré du groupe.",confirmDeleteGroup:"Ce groupe et toutes ses dépenses seront supprimés définitivement.",confirmYes:"Oui, supprimer",confirmNo:"Annuler",editExpense:"Modifier la dépense",editMember:"Modifier le membre",editGroup:"Modifier le groupe",namePH:"Prénom...",colorLabel:"Couleur",langLabel:"Langue",inviteEmail:"Email de la personne...",inviteBtn:"Inviter",inviteSuccess:"Invitation envoyée !",inviteError:"Utilisateur introuvable.",inviteSelf:"Tu ne peux pas t'inviter toi-même.",alreadyMember:"Déjà dans le groupe.",inviteSection:"Partager ce groupe",invitedUsers:"Accès au groupe",signOut:"Se déconnecter",signOutConfirm:"Se déconnecter ?",loading:"Chargement...",paidAmount:"Montant payé",shareAmount:"Part",equalShares:"Parts égales",customShares:"Personnaliser",totalPaid:"Total payé",remaining:"Restant à répartir",over:"Dépassement de" },
  en: { appTitle:"SplitEasy",rtl:false,groups:"My groups",newGroup:"New group",groupNamePH:"Group name...",create:"Create",cancel:"Cancel",back:"← Groups",noGroups:"No groups yet. Create one!",members:"Members",memberPH:"First name...",add:"Add",expenses:"Expenses",balances:"Balances",descPH:"Description...",amountPH:"Amount (€)",paidBy:"Paid by",splitAmong:"Split among",each:"each",save:"Save",owes:"owes",to:"to",settled:"All settled! 🎉",noExpenses:"No expenses yet.",noMembers:"Add members first.",total:"Total",membersCount:"members",expensesCount:"expenses",edit:"Edit",delete:"Delete",confirmDeleteTitle:"Delete permanently?",confirmDeleteExp:"This expense will be permanently deleted.",confirmDeleteMember:"This member will be removed from the group.",confirmDeleteGroup:"This group and all its expenses will be permanently deleted.",confirmYes:"Yes, delete",confirmNo:"Cancel",editExpense:"Edit expense",editMember:"Edit member",editGroup:"Edit group",namePH:"First name...",colorLabel:"Color",langLabel:"Language",inviteEmail:"Person's email...",inviteBtn:"Invite",inviteSuccess:"Invitation sent!",inviteError:"User not found.",inviteSelf:"You can't invite yourself.",alreadyMember:"Already in the group.",inviteSection:"Share this group",invitedUsers:"Group access",signOut:"Sign out",signOutConfirm:"Sign out?",loading:"Loading...",paidAmount:"Amount paid",shareAmount:"Share",equalShares:"Equal shares",customShares:"Customize",totalPaid:"Total paid",remaining:"Remaining to split",over:"Over by" },
  it: { appTitle:"SplitEasy",rtl:false,groups:"I miei gruppi",newGroup:"Nuovo gruppo",groupNamePH:"Nome del gruppo...",create:"Crea",cancel:"Annulla",back:"← Gruppi",noGroups:"Nessun gruppo. Creane uno!",members:"Membri",memberPH:"Nome...",add:"Aggiungi",expenses:"Spese",balances:"Saldi",descPH:"Descrizione...",amountPH:"Importo (€)",paidBy:"Pagato da",splitAmong:"Dividi tra",each:"ciascuno",save:"Salva",owes:"deve",to:"a",settled:"Tutto saldato! 🎉",noExpenses:"Nessuna spesa.",noMembers:"Aggiungi membri.",total:"Totale",membersCount:"membri",expensesCount:"spese",edit:"Modifica",delete:"Elimina",confirmDeleteTitle:"Eliminare definitivamente?",confirmDeleteExp:"Questa spesa verrà eliminata.",confirmDeleteMember:"Questo membro verrà rimosso.",confirmDeleteGroup:"Questo gruppo verrà eliminato.",confirmYes:"Sì, elimina",confirmNo:"Annulla",editExpense:"Modifica spesa",editMember:"Modifica membro",editGroup:"Modifica gruppo",namePH:"Nome...",colorLabel:"Colore",langLabel:"Lingua",inviteEmail:"Email della persona...",inviteBtn:"Invita",inviteSuccess:"Invito inviato!",inviteError:"Utente non trovato.",inviteSelf:"Non puoi invitare te stesso.",alreadyMember:"Già nel gruppo.",inviteSection:"Condividi gruppo",invitedUsers:"Accesso al gruppo",signOut:"Esci",signOutConfirm:"Esci?",loading:"Caricamento..." },
  es: { appTitle:"SplitEasy",rtl:false,groups:"Mis grupos",newGroup:"Nuevo grupo",groupNamePH:"Nombre del grupo...",create:"Crear",cancel:"Cancelar",back:"← Grupos",noGroups:"Ningún grupo. ¡Crea uno!",members:"Miembros",memberPH:"Nombre...",add:"Añadir",expenses:"Gastos",balances:"Balances",descPH:"Descripción...",amountPH:"Importe (€)",paidBy:"Pagado por",splitAmong:"Dividir entre",each:"cada uno",save:"Guardar",owes:"debe",to:"a",settled:"¡Todo saldado! 🎉",noExpenses:"Ningún gasto.",noMembers:"Añade miembros.",total:"Total",membersCount:"miembros",expensesCount:"gastos",edit:"Editar",delete:"Eliminar",confirmDeleteTitle:"¿Eliminar definitivamente?",confirmDeleteExp:"Este gasto se eliminará.",confirmDeleteMember:"Este miembro será eliminado.",confirmDeleteGroup:"Este grupo se eliminará.",confirmYes:"Sí, eliminar",confirmNo:"Cancelar",editExpense:"Editar gasto",editMember:"Editar miembro",editGroup:"Editar grupo",namePH:"Nombre...",colorLabel:"Color",langLabel:"Idioma",inviteEmail:"Email de la persona...",inviteBtn:"Invitar",inviteSuccess:"¡Invitación enviada!",inviteError:"Usuario no encontrado.",inviteSelf:"No puedes invitarte a ti mismo.",alreadyMember:"Ya está en el grupo.",inviteSection:"Compartir grupo",invitedUsers:"Acceso al grupo",signOut:"Cerrar sesión",signOutConfirm:"¿Cerrar sesión?",loading:"Cargando..." },
  pt: { appTitle:"SplitEasy",rtl:false,groups:"Meus grupos",newGroup:"Novo grupo",groupNamePH:"Nome do grupo...",create:"Criar",cancel:"Cancelar",back:"← Grupos",noGroups:"Nenhum grupo. Crie um!",members:"Membros",memberPH:"Nome...",add:"Adicionar",expenses:"Despesas",balances:"Saldos",descPH:"Descrição...",amountPH:"Valor (€)",paidBy:"Pago por",splitAmong:"Dividir entre",each:"cada um",save:"Salvar",owes:"deve",to:"para",settled:"Tudo acertado! 🎉",noExpenses:"Nenhuma despesa.",noMembers:"Adicione membros.",total:"Total",membersCount:"membros",expensesCount:"despesas",edit:"Editar",delete:"Excluir",confirmDeleteTitle:"Excluir definitivamente?",confirmDeleteExp:"Esta despesa será excluída.",confirmDeleteMember:"Este membro será removido.",confirmDeleteGroup:"Este grupo será excluído.",confirmYes:"Sim, excluir",confirmNo:"Cancelar",editExpense:"Editar despesa",editMember:"Editar membro",editGroup:"Editar grupo",namePH:"Nome...",colorLabel:"Cor",langLabel:"Idioma",inviteEmail:"Email da pessoa...",inviteBtn:"Convidar",inviteSuccess:"Convite enviado!",inviteError:"Usuário não encontrado.",inviteSelf:"Você não pode se convidar.",alreadyMember:"Já está no grupo.",inviteSection:"Compartilhar grupo",invitedUsers:"Acesso ao grupo",signOut:"Sair",signOutConfirm:"Sair?",loading:"Carregando..." },
  ar: { appTitle:"SplitEasy",rtl:true,groups:"مجموعاتي",newGroup:"مجموعة جديدة",groupNamePH:"اسم المجموعة...",create:"إنشاء",cancel:"إلغاء",back:"المجموعات →",noGroups:"لا توجد مجموعات. أنشئ واحدة!",members:"الأعضاء",memberPH:"الاسم...",add:"إضافة",expenses:"المصاريف",balances:"الأرصدة",descPH:"الوصف...",amountPH:"المبلغ (€)",paidBy:"دفع بواسطة",splitAmong:"تقسيم بين",each:"لكل شخص",save:"حفظ",owes:"مدين بـ",to:"لـ",settled:"كل شيء مسوّى! 🎉",noExpenses:"لا توجد مصاريف.",noMembers:"أضف أعضاء.",total:"الإجمالي",membersCount:"أعضاء",expensesCount:"مصاريف",edit:"تعديل",delete:"حذف",confirmDeleteTitle:"حذف نهائياً؟",confirmDeleteExp:"سيتم حذف هذا المصروف نهائياً.",confirmDeleteMember:"سيتم إزالة هذا العضو.",confirmDeleteGroup:"سيتم حذف هذه المجموعة نهائياً.",confirmYes:"نعم، احذف",confirmNo:"إلغاء",editExpense:"تعديل المصروف",editMember:"تعديل العضو",editGroup:"تعديل المجموعة",namePH:"الاسم...",colorLabel:"اللون",langLabel:"اللغة",inviteEmail:"البريد الإلكتروني...",inviteBtn:"دعوة",inviteSuccess:"تم إرسال الدعوة!",inviteError:"المستخدم غير موجود.",inviteSelf:"لا يمكنك دعوة نفسك.",alreadyMember:"هذا الشخص موجود بالفعل.",inviteSection:"مشاركة المجموعة",invitedUsers:"الوصول إلى المجموعة",signOut:"تسجيل الخروج",signOutConfirm:"تسجيل الخروج؟",loading:"جار التحميل..." },
  zh: { appTitle:"SplitEasy",rtl:false,groups:"我的群组",newGroup:"新建群组",groupNamePH:"群组名称...",create:"创建",cancel:"取消",back:"← 群组",noGroups:"暂无群组，请创建一个！",members:"成员",memberPH:"姓名...",add:"添加",expenses:"支出",balances:"结算",descPH:"描述...",amountPH:"金额 (€)",paidBy:"付款人",splitAmong:"分摊给",each:"每人",save:"保存",owes:"欠",to:"",settled:"已全部结清！🎉",noExpenses:"暂无支出。",noMembers:"请添加成员。",total:"合计",membersCount:"位成员",expensesCount:"笔支出",edit:"编辑",delete:"删除",confirmDeleteTitle:"永久删除？",confirmDeleteExp:"此支出将被永久删除。",confirmDeleteMember:"该成员将从群组中移除。",confirmDeleteGroup:"该群组及其所有支出将被永久删除。",confirmYes:"是，删除",confirmNo:"取消",editExpense:"编辑支出",editMember:"编辑成员",editGroup:"编辑群组",namePH:"姓名...",colorLabel:"颜色",langLabel:"语言",inviteEmail:"对方邮箱...",inviteBtn:"邀请",inviteSuccess:"邀请已发送！",inviteError:"用户不存在。",inviteSelf:"不能邀请自己。",alreadyMember:"该用户已在群组中。",inviteSection:"分享群组",invitedUsers:"群组成员",signOut:"退出登录",signOutConfirm:"确认退出？",loading:"加载中..." },
};

const COLORS = ["#FFE000","#00C853","#FF6B00","#FF00CC","#00BFFF","#FF1744","#AA00FF","#00E5CC","#FF9900","#1565FF","#39FF14","#FF4081","#FFD600","#00BCD4","#D50000","#6200EA"];
const GROUP_COLORS = ["#4ECDC4","#FF6B6B","#FFE66D","#A8DADC","#F9A26C","#C3B1E1","#95E1D3","#6BCB77","#4D96FF","#F38181"];
const EMOJIS = ["🏠","✈️","🍕","🎉","🏖️","🚗","🎓","💼","🎮","🌿","⚽","🎸","🍻","💪","🐾"];

function Avatar({ name, color, size = 36 }) {
  return <div style={{ width:size,height:size,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*0.38,color:"#0f0f1a",flexShrink:0,border:"2px solid rgba(255,255,255,0.13)" }}>{name[0]?.toUpperCase()}</div>;
}
function Chip({ label, color, active, onClick }) {
  return <button onClick={onClick} style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 13px 6px 7px",borderRadius:30,border:`2px solid ${active?color:"rgba(255,255,255,0.1)"}`,background:active?`${color}22`:"transparent",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600 }}><Avatar name={label} color={color} size={22}/>{label}</button>;
}
function Label({ children }) {
  return <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.38)",textTransform:"uppercase",letterSpacing:1.3,marginBottom:8 }}>{children}</div>;
}
function Section({ title, children }) {
  return <div style={{ marginTop:22 }}><Label>{title}</Label>{children}</div>;
}
function EmptyMsg({ msg }) {
  return <div style={{ color:"rgba(255,255,255,0.28)",fontSize:14,padding:"14px 0",textAlign:"center" }}>{msg}</div>;
}
function ConfirmModal({ message, onConfirm, onCancel, t }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(6px)",padding:"0 24px" }} onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div style={{ background:"#1e1e35",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,border:"1px solid rgba(255,107,107,0.25)",boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize:32,marginBottom:14,textAlign:"center" }}>🗑️</div>
        <div style={{ fontSize:17,fontWeight:800,color:"#fff",marginBottom:10,textAlign:"center" }}>{t.confirmDeleteTitle}</div>
        <div style={{ fontSize:14,color:"rgba(255,255,255,0.45)",textAlign:"center",marginBottom:24,lineHeight:1.5 }}>{message}</div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onCancel} style={{ flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"12px 0",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 }}>{t.confirmNo}</button>
          <button onClick={onConfirm} style={{ flex:1,background:"linear-gradient(135deg,#FF6B6B,#e05555)",border:"none",borderRadius:12,padding:"12px 0",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14 }}>{t.confirmYes}</button>
        </div>
      </div>
    </div>
  );
}
function DotsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position:"relative",flexShrink:0 }}>
      <button onClick={e=>{e.stopPropagation();setOpen(o=>!o);}} style={{ background:open?"rgba(255,255,255,0.1)":"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.55)",fontSize:18,fontWeight:700 }}>⋮</button>
      {open&&(
        <div style={{ position:"absolute",right:0,top:38,background:"#252540",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:6,zIndex:100,minWidth:150,boxShadow:"0 8px 30px rgba(0,0,0,0.5)" }}>
          {onEdit&&<button onClick={e=>{e.stopPropagation();setOpen(false);onEdit();}} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",background:"transparent",border:"none",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600,borderRadius:8 }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✏️ Modifier</button>}
          <button onClick={e=>{e.stopPropagation();setOpen(false);onDelete();}} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",background:"transparent",border:"none",color:"#FF6B6B",cursor:"pointer",fontSize:14,fontWeight:600,borderRadius:8 }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,107,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>🗑️ Supprimer</button>
        </div>
      )}
    </div>
  );
}
function Modal({ onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",zIndex:50,backdropFilter:"blur(5px)" }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#1a1a2e",borderRadius:"22px 22px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,margin:"0 auto",border:"1px solid rgba(255,255,255,0.08)",maxHeight:"88vh",overflowY:"auto" }}>{children}</div>
    </div>
  );
}
const IS = { background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box" };
const BP = { background:"linear-gradient(135deg,#4ECDC4,#2bb5ac)",border:"none",borderRadius:10,padding:"10px 20px",color:"#0f0f1a",fontWeight:700,cursor:"pointer",fontSize:14 };
const BS = { background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 20px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 };

export default function App() {
  const [user, setUser] = useState(undefined);
  const [lang, setLang] = useState(()=>{ try{return localStorage.getItem("splitEasyLang")||"fr"}catch{return"fr"} });
  const t = T[lang]||T.fr;
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [tab, setTab] = useState("balances");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [gfName, setGfName] = useState(""); const [gfEmoji, setGfEmoji] = useState("🏠"); const [gfColor, setGfColor] = useState(GROUP_COLORS[0]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  // ef: { desc, payers: [{id, amount}], splits: [{id, amount, custom}] }
  const [ef, setEF] = useState({ desc:"", payers:[], splits:[] });
  const [newMember, setNewMember] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberName, setEditMemberName] = useState(""); const [editMemberColor, setEditMemberColor] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [inviteEmail, setInviteEmail] = useState(""); const [inviteMsg, setInviteMsg] = useState("");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const activeGroup = groups.find(g=>g.id===activeGroupId);
  const getPart = id => activeGroup?.members?.find(m=>m.id===id);
  const askConfirm = (msg, fn) => setConfirmDel({ message:msg, onConfirm:fn });

  useEffect(()=>{ const u=onAuthStateChanged(auth,u=>setUser(u)); return u; },[]);
  useEffect(()=>{ try{localStorage.setItem("splitEasyLang",lang)}catch{} },[lang]);

  useEffect(()=>{
    if(!user) return;
    const q=query(collection(db,"groups"),where("sharedWith","array-contains",user.uid));
    const u=onSnapshot(q,snap=>{
      const gs=snap.docs.map(d=>({id:d.id,...d.data()}));
      gs.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
      setGroups(gs);
    });
    return u;
  },[user]);

  useEffect(()=>{
    if(!user) return;
    setDoc(doc(db,"users",user.uid),{uid:user.uid,email:user.email?.toLowerCase(),displayName:user.displayName||""},{merge:true});
  },[user]);

  const upd = async (id,data) => { await updateDoc(doc(db,"groups",id),data); };

  const saveGroup = async () => {
    if(!gfName.trim()||!user) return;
    if(editingGroup){ await upd(editingGroup.id,{name:gfName.trim(),emoji:gfEmoji,color:gfColor}); }
    else {
      const r=await addDoc(collection(db,"groups"),{name:gfName.trim(),emoji:gfEmoji,color:gfColor,members:[],expenses:[],owner:user.uid,sharedWith:[user.uid],sharedEmails:[user.email?.toLowerCase()],createdAt:serverTimestamp()});
      setActiveGroupId(r.id); setTab("balances");
    }
    setShowGroupForm(false);
  };
  const deleteGroup = async id => { await deleteDoc(doc(db,"groups",id)); if(activeGroupId===id) setActiveGroupId(null); };

  const addMember = async () => {
    if(!newMember.trim()||!activeGroup) return;
    const m={id:Date.now().toString(),name:newMember.trim(),color:COLORS[(activeGroup.members?.length||0)%COLORS.length]};
    await upd(activeGroupId,{members:[...(activeGroup.members||[]),m]});
    setNewMember("");
  };
  const saveMember = async () => {
    if(!editMemberName.trim()||!activeGroup) return;
    await upd(activeGroupId,{members:activeGroup.members.map(m=>m.id===editingMember.id?{...m,name:editMemberName.trim(),color:editMemberColor}:m)});
    setEditingMember(null);
  };
  const deleteMember = async id => {
    const members=activeGroup.members.filter(m=>m.id!==id);
    const expenses=activeGroup.expenses.map(e=>({...e,splitAmong:e.splitAmong.filter(x=>x!==id)})).filter(e=>e.splitAmong.length>0);
    await upd(activeGroupId,{members,expenses});
  };

  const openNewExpense = () => {
    if(!activeGroup||(activeGroup.members?.length||0)<2) return;
    setEditingExpense(null);
    const members = activeGroup.members||[];
    const equalShare = parseFloat((0/members.length).toFixed(2));
    setEF({
      desc:"",
      payers:[{id:members[0].id, amount:""}],
      splits: members.map(m=>({id:m.id, amount:"", custom:false}))
    });
    setShowExpenseForm(true);
  };
  const openEditExpense = exp => {
    setEditingExpense(exp);
    const members = activeGroup.members||[];
    // Support old single-payer format and new multi-payer
    const payers = exp.payers || [{id:exp.paidBy, amount:String(exp.amount)}];
    const splits = exp.splits || members.map(m=>({
      id:m.id,
      amount: exp.splitAmong.includes(m.id) ? String((exp.amount/exp.splitAmong.length).toFixed(2)) : "0",
      custom: false
    }));
    setEF({desc:exp.desc, payers, splits});
    setShowExpenseForm(true);
  };
  const saveExpense = async () => {
    if(!ef.desc||!activeGroup) return;
    const totalPaid = ef.payers.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
    if(totalPaid<=0) return;
    const activeSplits = ef.splits.filter(s=>(parseFloat(s.amount)||0)>0);
    if(activeSplits.length===0) return;
    const data={
      id:editingExpense?.id||Date.now().toString(),
      desc:ef.desc,
      amount:totalPaid,
      // keep legacy fields for compatibility
      paidBy: ef.payers[0]?.id,
      splitAmong: activeSplits.map(s=>s.id),
      // new multi fields
      payers: ef.payers.filter(p=>(parseFloat(p.amount)||0)>0),
      splits: activeSplits,
    };
    const expenses=editingExpense?activeGroup.expenses.map(e=>e.id===editingExpense.id?data:e):[...(activeGroup.expenses||[]),data];
    await upd(activeGroupId,{expenses});
    setShowExpenseForm(false);
  };
  const deleteExpense = async id => { await upd(activeGroupId,{expenses:activeGroup.expenses.filter(e=>e.id!==id)}); };
  // Multi-payer helpers
  const togglePayer = (id) => {
    setEF(f => {
      const exists = f.payers.find(p=>p.id===id);
      const payers = exists ? f.payers.filter(p=>p.id!==id) : [...f.payers, {id, amount:""}];
      return {...f, payers};
    });
  };
  const setPayerAmount = (id, val) => {
    setEF(f => ({...f, payers: f.payers.map(p=>p.id===id?{...p,amount:val}:p)}));
  };
  const toggleSplitMember = (id) => {
    setEF(f => {
      const s = f.splits.find(x=>x.id===id);
      const newAmt = (parseFloat(s?.amount)||0)>0 ? "0" : "";
      const splits = f.splits.map(x=>x.id===id?{...x,amount:newAmt,custom:true}:x);
      // recalc equal shares for non-custom
      return recalcSplits({...f, splits});
    });
  };
  const setSplitAmount = (id, val) => {
    setEF(f => {
      const splits = f.splits.map(x=>x.id===id?{...x,amount:val,custom:true}:x);
      return {...f, splits};
    });
  };
  const recalcSplits = (form) => {
    const total = form.payers.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
    const active = form.splits.filter(s=>!s.custom||(parseFloat(s.amount)||0)>0);
    const customTotal = form.splits.filter(s=>s.custom).reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
    const nonCustom = form.splits.filter(s=>!s.custom);
    if(nonCustom.length===0) return form;
    const remaining = Math.max(0, total - customTotal);
    const share = nonCustom.length>0 ? (remaining/nonCustom.length).toFixed(2) : "0";
    const splits = form.splits.map(s=>s.custom?s:{...s,amount:share});
    return {...form, splits};
  };
  const equalizeShares = () => {
    setEF(f => {
      const total = f.payers.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
      const active = f.splits.filter(s=>(parseFloat(s.amount)||0)>0||!f.splits.find(x=>x.id===s.id)?.custom);
      const activeCount = f.splits.length;
      const share = activeCount>0?(total/activeCount).toFixed(2):"0";
      return {...f, splits: f.splits.map(s=>({...s,amount:share,custom:false}))};
    });
  };

  const handleInvite = async () => {
    setInviteMsg("");
    const email=inviteEmail.trim().toLowerCase();
    if(!email||!activeGroup) return;
    if(email===user.email?.toLowerCase()){setInviteMsg(t.inviteSelf);return;}
    if(activeGroup.sharedEmails?.includes(email)){setInviteMsg(t.alreadyMember);return;}
    const snap=await getDocs(query(collection(db,"users"),where("email","==",email)));
    if(snap.empty){setInviteMsg(t.inviteError);return;}
    const inv=snap.docs[0].data();
    await updateDoc(doc(db,"groups",activeGroupId),{sharedWith:arrayUnion(inv.uid),sharedEmails:arrayUnion(email)});
    setInviteMsg(t.inviteSuccess); setInviteEmail("");
  };

  const getDebts = useCallback(group=>{
    if(!group) return [];
    const b={};
    (group.members||[]).forEach(m=>b[m.id]=0);
    (group.expenses||[]).forEach(exp=>{
      // Handle new multi-payer format
      if(exp.payers && exp.payers.length>0) {
        exp.payers.forEach(p=>{ b[p.id]=(b[p.id]||0)+parseFloat(p.amount||0); });
      } else {
        b[exp.paidBy]=(b[exp.paidBy]||0)+exp.amount;
      }
      // Handle new splits format
      if(exp.splits && exp.splits.length>0) {
        exp.splits.forEach(s=>{ b[s.id]=(b[s.id]||0)-parseFloat(s.amount||0); });
      } else {
        const share=exp.amount/exp.splitAmong.length;
        exp.splitAmong.forEach(id=>{b[id]=(b[id]||0)-share;});
      }
    });
    const cred=Object.entries(b).filter(([,v])=>v>0.01).map(([id,v])=>[id,v]).sort((a,b)=>b[1]-a[1]);
    const debt=Object.entries(b).filter(([,v])=>v<-0.01).map(([id,v])=>[id,v]).sort((a,b)=>a[1]-b[1]);
    const debts=[];let ci=0,di=0;
    while(ci<cred.length&&di<debt.length){
      const amt=Math.min(cred[ci][1],-debt[di][1]);
      debts.push({from:debt[di][0],to:cred[ci][0],amount:amt});
      cred[ci][1]-=amt;debt[di][1]+=amt;
      if(Math.abs(cred[ci][1])<0.01)ci++;
      if(Math.abs(debt[di][1])<0.01)di++;
    }
    return debts;
  },[]);

  if(user===undefined) return <div style={{minHeight:"100vh",background:"#0f0f1a",display:"flex",alignItems:"center",justifyContent:"center",color:"#4ECDC4",fontSize:18,fontFamily:"'DM Sans',sans-serif"}}>💸 SplitEasy...</div>;
  if(!user) return <AuthScreen lang={lang}/>;

  const debts=getDebts(activeGroup);
  const totalExp=activeGroup?.expenses?.reduce((s,e)=>s+e.amount,0)??0;

  const LangSelect = ({full=false}) => (
    <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",color:"#4ECDC4",borderRadius:10,padding:full?"6px 10px":"5px 6px",cursor:"pointer",fontSize:full?13:16,fontWeight:700,outline:"none",appearance:"none",WebkitAppearance:"none"}}>
      {LANGUAGES.map(l=><option key={l.code} value={l.code} style={{background:"#1a1a2e",color:"#fff"}}>{full?`${l.flag} ${l.label}`:l.flag}</option>)}
    </select>
  );

  const GroupForm = () => (
    <Modal onClose={()=>setShowGroupForm(false)}>
      <div style={{fontSize:18,fontWeight:800,marginBottom:20,color:"#4ECDC4"}}>✦ {editingGroup?t.editGroup:t.newGroup}</div>
      <Label>Emoji</Label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
        {EMOJIS.map(e=><button key={e} onClick={()=>setGfEmoji(e)} style={{width:42,height:42,borderRadius:12,fontSize:22,cursor:"pointer",background:gfEmoji===e?"rgba(78,205,196,0.2)":"rgba(255,255,255,0.05)",border:`2px solid ${gfEmoji===e?"#4ECDC4":"rgba(255,255,255,0.1)"}`}}>{e}</button>)}
      </div>
      <Label>{t.colorLabel}</Label>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {GROUP_COLORS.map(c=><button key={c} onClick={()=>setGfColor(c)} style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${gfColor===c?"#fff":"transparent"}`,boxSizing:"border-box"}}/>)}
      </div>
      <input value={gfName} onChange={e=>setGfName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveGroup()} placeholder={t.groupNamePH} style={{...IS,marginBottom:18}} autoFocus/>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>setShowGroupForm(false)} style={{...BS,flex:1}}>{t.cancel}</button>
        <button onClick={saveGroup} style={{...BP,flex:2}}>{editingGroup?t.save:t.create}</button>
      </div>
    </Modal>
  );

  // ── Groups list ──
  if(!activeGroupId) return (
    <div style={{minHeight:"100vh",background:"#0f0f1a",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#f0f0f0"}}>
      <div style={{background:"linear-gradient(135deg,#1a1a3e,#0f0f1a)",padding:"28px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:480,margin:"0 auto"}}>
          <div>
            <div style={{fontSize:24,fontWeight:800,letterSpacing:"-0.5px"}}>SplitEasy <span style={{color:"#4ECDC4"}}>✦</span></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:1}}>{user.displayName||user.email}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <LangSelect full/>
            <button onClick={()=>setShowSignOutConfirm(true)} title={t.signOut} style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.2)",color:"#FF6B6B",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:700}}>↪</button>
          </div>
        </div>
      </div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"20px 16px 100px"}}>
        {groups.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:48,marginBottom:12}}>💸</div><div style={{fontSize:15}}>{t.noGroups}</div></div>}
        {groups.map(g=>(
          <div key={g.id} style={{marginBottom:12}}>
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${g.color}33`,borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>{setActiveGroupId(g.id);setTab("balances");}} style={{display:"flex",alignItems:"center",gap:14,flex:1,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",padding:0,minWidth:0}}>
                <div style={{width:52,height:52,borderRadius:16,background:`${g.color}22`,border:`2px solid ${g.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{g.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:16,color:"#fff",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{(g.members||[]).length} {t.membersCount} · {(g.expenses||[]).length} {t.expensesCount}</div>
                </div>
              </button>
              <div style={{display:"flex",flexShrink:0}}>
                {(g.members||[]).slice(0,4).map((m,i)=><div key={m.id} style={{marginLeft:i===0?0:-8,zIndex:10-i}}><Avatar name={m.name} color={m.color} size={30}/></div>)}
                {(g.members||[]).length>4&&<div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"2px solid rgba(255,255,255,0.13)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,marginLeft:-8}}>+{g.members.length-4}</div>}
              </div>
              <DotsMenu onEdit={()=>{setEditingGroup(g);setGfName(g.name);setGfEmoji(g.emoji);setGfColor(g.color);setShowGroupForm(true);}} onDelete={()=>askConfirm(t.confirmDeleteGroup,()=>{deleteGroup(g.id);setConfirmDel(null);})}/>
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>{setEditingGroup(null);setGfName("");setGfEmoji("🏠");setGfColor(GROUP_COLORS[0]);setShowGroupForm(true);}} style={{position:"fixed",bottom:28,right:24,background:"linear-gradient(135deg,#4ECDC4,#2bb5ac)",border:"none",borderRadius:16,padding:"14px 22px",color:"#0f0f1a",fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:"0 8px 24px rgba(78,205,196,0.4)",display:"flex",alignItems:"center",gap:8,zIndex:20}}>+ {t.newGroup}</button>
      {showGroupForm&&<GroupForm/>}
      {showSignOutConfirm&&<ConfirmModal message={t.signOutConfirm} onConfirm={()=>{signOut(auth);setShowSignOutConfirm(false);}} onCancel={()=>setShowSignOutConfirm(false)} t={{...t,confirmDeleteTitle:t.signOut,confirmYes:t.signOut}}/>}
      {confirmDel&&<ConfirmModal message={confirmDel.message} onConfirm={confirmDel.onConfirm} onCancel={()=>setConfirmDel(null)} t={t}/>}
    </div>
  );

  // ── Group detail ──
  return (
    <div style={{minHeight:"100vh",background:"#0f0f1a",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#f0f0f0",paddingBottom:90}}>
      <div style={{background:"linear-gradient(135deg,#1a1a3e,#0f0f1a)",padding:"20px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <button onClick={()=>setActiveGroupId(null)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",borderRadius:9,padding:"6px 12px",cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0}}>{t.back}</button>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:10,minWidth:0}}>
              <div style={{width:34,height:34,borderRadius:10,background:`${activeGroup.color}22`,border:`2px solid ${activeGroup.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{activeGroup.emoji}</div>
              <div style={{fontWeight:800,fontSize:16,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{activeGroup.name}</div>
            </div>
            <DotsMenu onEdit={()=>{setEditingGroup(activeGroup);setGfName(activeGroup.name);setGfEmoji(activeGroup.emoji);setGfColor(activeGroup.color);setShowGroupForm(true);}} onDelete={()=>askConfirm(t.confirmDeleteGroup,()=>{deleteGroup(activeGroup.id);setConfirmDel(null);})}/>
            <LangSelect/>
          </div>
          <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4}}>
            {["balances","expenses","members","invite"].map(tn=>(
              <button key={tn} onClick={()=>setTab(tn)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",cursor:"pointer",background:tab===tn?`${activeGroup.color}28`:"transparent",color:tab===tn?activeGroup.color:"rgba(255,255,255,0.38)",fontWeight:700,fontSize:11,transition:"all 0.2s"}}>
                {tn==="balances"?t.balances:tn==="expenses"?t.expenses:tn==="members"?t.members:"👥"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px"}}>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <div style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"13px 16px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.total}</div>
            <div style={{fontSize:22,fontWeight:800,color:"#FFE66D"}}>{totalExp.toFixed(2)}€</div>
          </div>
          <div style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"13px 16px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.members}</div>
            <div style={{display:"flex"}}>
              {(activeGroup.members||[]).slice(0,5).map((m,i)=><div key={m.id} style={{marginLeft:i===0?0:-6}}><Avatar name={m.name} color={m.color} size={28}/></div>)}
              {(activeGroup.members||[]).length===0&&<div style={{fontSize:22,fontWeight:800,color:"#4ECDC4"}}>0</div>}
            </div>
          </div>
        </div>

        {tab==="balances"&&(
          <Section title={t.balances}>
            {(activeGroup.members||[]).length<2?<EmptyMsg msg={t.noMembers}/>:
              debts.length===0?<div style={{textAlign:"center",padding:"20px 0",color:"#4ECDC4",fontWeight:700,fontSize:16}}>{t.settled}</div>:
              debts.map((d,i)=>{
                const from=getPart(d.from),to=getPart(d.to);
                if(!from||!to) return null;
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 14px",marginBottom:8,border:"1px solid rgba(255,107,107,0.12)"}}>
                    <Avatar name={from.name} color={from.color}/>
                    <div style={{flex:1}}>
                      <span style={{fontWeight:700,color:"#FF6B6B"}}>{from.name}</span>
                      <span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}> {t.owes} </span>
                      <span style={{fontWeight:800,color:"#FFE66D"}}>{d.amount.toFixed(2)}€</span>
                      <span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}> {t.to} </span>
                      <span style={{fontWeight:700,color:"#4ECDC4"}}>{to.name}</span>
                    </div>
                    <Avatar name={to.name} color={to.color}/>
                  </div>
                );
              })
            }
          </Section>
        )}

        {tab==="expenses"&&(
          <Section title={t.expenses}>
            {(activeGroup.expenses||[]).length===0&&<EmptyMsg msg={t.noExpenses}/>}
            {[...(activeGroup.expenses||[])].reverse().map(exp=>{
              const payer=getPart(exp.paidBy);
              return(
                <div key={exp.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:"13px 14px",marginBottom:9,border:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:11,alignItems:"flex-start"}}>
                  {/* Payers avatars stacked */}
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {(exp.payers||[{id:exp.paidBy,amount:exp.amount}]).map(pr=>{const pp=getPart(pr.id);return pp?<Avatar key={pr.id} name={pp.name} color={pp.color}/>:null;})}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:700}}>{exp.desc}</span>
                      <span style={{fontWeight:800,color:"#FFE66D"}}>{exp.amount.toFixed(2)}€</span>
                    </div>
                    {/* Payers line */}
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3}}>
                      {(exp.payers||[{id:exp.paidBy,amount:exp.amount}]).map((pr,i)=>{const pp=getPart(pr.id);return pp?<span key={pr.id}>{i>0?", ":""}{pp.name} ({parseFloat(pr.amount||0).toFixed(2)}€)</span>:null;})}
                    </div>
                    <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
                      {(exp.splits||exp.splitAmong.map(id=>({id,amount:(exp.amount/exp.splitAmong.length)}))).map(s=>{const p=getPart(s.id);return p?<Avatar key={s.id} name={p.name} color={p.color} size={20}/>:null;})}
                    </div>
                  </div>
                  <DotsMenu onEdit={()=>openEditExpense(exp)} onDelete={()=>askConfirm(t.confirmDeleteExp,()=>{deleteExpense(exp.id);setConfirmDel(null);})}/>
                </div>
              );
            })}
          </Section>
        )}

        {tab==="members"&&(
          <Section title={t.members}>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {(activeGroup.members||[]).map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"11px 14px",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <Avatar name={m.name} color={m.color}/>
                  <span style={{fontWeight:600,flex:1}}>{m.name}</span>
                  <DotsMenu onEdit={()=>{setEditingMember(m);setEditMemberName(m.name);setEditMemberColor(m.color);}} onDelete={()=>askConfirm(t.confirmDeleteMember,()=>{deleteMember(m.id);setConfirmDel(null);})}/>
                </div>
              ))}
              {(activeGroup.members||[]).length===0&&<EmptyMsg msg={t.noMembers}/>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={newMember} onChange={e=>setNewMember(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMember()} placeholder={t.memberPH} style={{...IS,flex:1,width:"auto"}}/>
              <button onClick={addMember} style={BP}>{t.add}</button>
            </div>
          </Section>
        )}

        {tab==="invite"&&(
          <Section title={t.inviteSection}>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:16,border:"1px solid rgba(78,205,196,0.15)"}}>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:14,lineHeight:1.5}}>👥 Entre l'email d'un ami qui a un compte SplitEasy pour lui donner accès à ce groupe.</div>
              <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleInvite()} placeholder={t.inviteEmail} type="email" style={{...IS,marginBottom:10}}/>
              {inviteMsg&&<div style={{fontSize:13,padding:"8px 12px",borderRadius:8,marginBottom:10,background:inviteMsg===t.inviteSuccess?"rgba(78,205,196,0.1)":"rgba(255,107,107,0.1)",color:inviteMsg===t.inviteSuccess?"#4ECDC4":"#FF6B6B"}}>{inviteMsg}</div>}
              <button onClick={handleInvite} style={{...BP,width:"100%"}}>{t.inviteBtn}</button>
            </div>
            <Label>{t.invitedUsers}</Label>
            {(activeGroup.sharedEmails||[]).map((email,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"11px 14px",marginBottom:8,border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:GROUP_COLORS[i%GROUP_COLORS.length]+"33",border:`2px solid ${GROUP_COLORS[i%GROUP_COLORS.length]}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{i===0?"👑":"👤"}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:"#fff",fontWeight:600}}>{email}</div>
                  {i===0&&<div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>Créateur</div>}
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>

      {tab!=="members"&&tab!=="invite"&&(activeGroup.members||[]).length>=2&&(
        <button onClick={openNewExpense} style={{position:"fixed",bottom:28,right:24,background:`linear-gradient(135deg,${activeGroup.color},${activeGroup.color}bb)`,border:"none",borderRadius:"50%",width:58,height:58,fontSize:28,color:"#0f0f1a",cursor:"pointer",boxShadow:`0 8px 24px ${activeGroup.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,zIndex:20}}>+</button>
      )}

      {showExpenseForm&&activeGroup&&(()=>{
        const totalPaid = ef.payers.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
        const totalSplit = ef.splits.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
        const diff = totalPaid - totalSplit;
        const acColor = activeGroup.color;
        return (
        <Modal onClose={()=>setShowExpenseForm(false)}>
          <div style={{fontSize:17,fontWeight:800,marginBottom:18,color:acColor}}>{activeGroup.emoji} {editingExpense?t.editExpense:t.expenses}</div>
          <input value={ef.desc} onChange={e=>setEF(f=>({...f,desc:e.target.value}))} placeholder={t.descPH} style={{...IS,marginBottom:16}} autoFocus/>

          {/* PAYERS */}
          <Label>{t.paidBy}</Label>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:8}}>
            {(activeGroup.members||[]).map(m=>{
              const payer = ef.payers.find(p=>p.id===m.id);
              const isActive = !!payer;
              return (
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,background:isActive?`${m.color}15`:"rgba(255,255,255,0.03)",borderRadius:12,padding:"10px 12px",border:`1.5px solid ${isActive?m.color:"rgba(255,255,255,0.08)"}`}}>
                  <button onClick={()=>togglePayer(m.id)} style={{display:"flex",alignItems:"center",gap:8,background:"transparent",border:"none",cursor:"pointer",flex:1,padding:0}}>
                    <Avatar name={m.name} color={m.color} size={30}/>
                    <span style={{fontWeight:700,color:isActive?"#fff":"rgba(255,255,255,0.4)",fontSize:14}}>{m.name}</span>
                  </button>
                  {isActive&&(
                    <input
                      value={payer.amount}
                      onChange={e=>{setPayerAmount(m.id,e.target.value); setTimeout(()=>setEF(f=>recalcSplits(f)),0);}}
                      placeholder="0.00"
                      type="number"
                      style={{...IS,width:90,marginBottom:0,textAlign:"right",fontWeight:700,color:acColor}}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {totalPaid>0&&<div style={{background:`${acColor}18`,borderRadius:10,padding:"7px 12px",marginBottom:14,fontSize:13,color:acColor,fontWeight:700}}>💰 {t.totalPaid} : {totalPaid.toFixed(2)}€</div>}

          {/* SPLITS */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Label>{t.splitAmong}</Label>
            {totalPaid>0&&<button onClick={equalizeShares} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"4px 10px",color:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:11,fontWeight:700}}>{t.equalShares}</button>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {(activeGroup.members||[]).map(m=>{
              const split = ef.splits.find(s=>s.id===m.id)||{id:m.id,amount:"0",custom:false};
              const isActive = (parseFloat(split.amount)||0)>0;
              return (
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,background:isActive?`${m.color}15`:"rgba(255,255,255,0.03)",borderRadius:12,padding:"10px 12px",border:`1.5px solid ${isActive?m.color:"rgba(255,255,255,0.08)"}`}}>
                  <button onClick={()=>toggleSplitMember(m.id)} style={{display:"flex",alignItems:"center",gap:8,background:"transparent",border:"none",cursor:"pointer",flex:1,padding:0}}>
                    <Avatar name={m.name} color={m.color} size={30}/>
                    <span style={{fontWeight:700,color:isActive?"#fff":"rgba(255,255,255,0.4)",fontSize:14}}>{m.name}</span>
                  </button>
                  <input
                    value={split.amount}
                    onChange={e=>setSplitAmount(m.id,e.target.value)}
                    placeholder="0.00"
                    type="number"
                    style={{...IS,width:90,marginBottom:0,textAlign:"right",fontWeight:700,color:isActive?m.color:"rgba(255,255,255,0.25)"}}
                  />
                </div>
              );
            })}
          </div>

          {/* Balance check */}
          {totalPaid>0&&(
            <div style={{background:Math.abs(diff)<0.01?"rgba(78,205,196,0.12)":diff>0?"rgba(255,230,109,0.12)":"rgba(255,107,107,0.12)",borderRadius:10,padding:"8px 14px",marginBottom:16,fontSize:13,fontWeight:700,color:Math.abs(diff)<0.01?"#4ECDC4":diff>0?"#FFE66D":"#FF6B6B",display:"flex",justifyContent:"space-between"}}>
              <span>{Math.abs(diff)<0.01?"✅ Tout est équilibré":diff>0?`⚠️ ${t.remaining} : ${diff.toFixed(2)}€`:`⚠️ ${t.over} : ${Math.abs(diff).toFixed(2)}€`}</span>
              <span>{t.totalPaid} {totalSplit.toFixed(2)}€ / {totalPaid.toFixed(2)}€</span>
            </div>
          )}

          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowExpenseForm(false)} style={{...BS,flex:1}}>{t.cancel}</button>
            <button onClick={saveExpense} style={{...BP,flex:2,background:`linear-gradient(135deg,${acColor},${acColor}aa)`}}>{t.save}</button>
          </div>
        </Modal>
        );
      })()}

      {editingMember&&(
        <Modal onClose={()=>setEditingMember(null)}>
          <div style={{fontSize:17,fontWeight:800,marginBottom:18,color:activeGroup.color}}>✏️ {t.editMember}</div>
          <input value={editMemberName} onChange={e=>setEditMemberName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveMember()} placeholder={t.namePH} style={{...IS,marginBottom:16}} autoFocus/>
          <Label>{t.colorLabel}</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20}}>
            {COLORS.map(c=><button key={c} onClick={()=>setEditMemberColor(c)} style={{width:36,height:36,borderRadius:"50%",background:c,cursor:"pointer",border:editMemberColor===c?"3px solid #fff":"3px solid transparent",boxShadow:editMemberColor===c?`0 0 0 2px ${c}`:"none",boxSizing:"border-box",transition:"all 0.15s"}}/>)}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setEditingMember(null)} style={{...BS,flex:1}}>{t.cancel}</button>
            <button onClick={saveMember} style={{...BP,flex:2,background:`linear-gradient(135deg,${editMemberColor},${editMemberColor}aa)`}}>{t.save}</button>
          </div>
        </Modal>
      )}

      {showGroupForm&&<GroupForm/>}
      {confirmDel&&<ConfirmModal message={confirmDel.message} onConfirm={confirmDel.onConfirm} onCancel={()=>setConfirmDel(null)} t={t}/>}
    </div>
  );
}

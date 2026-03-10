import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PREDEFINED_SUBJECTS = [
    { id: 'sub_1', name: 'Engineering Mathematics-II', teacher: 'Prof. Deepa Mandal' },
    { id: 'sub_2', name: 'Engineering Chemistry', teacher: 'Dr. ChandraPrabha Sahu' },
    { id: 'sub_3', name: 'Programming with Python', teacher: 'IBM SUBJECT EXPERT' },
    { id: 'sub_4', name: 'English for Skill Enhancement', teacher: 'Dr. Monika Singh' },
    { id: 'sub_5', name: 'Universal Human Values', teacher: 'Dr Binod Kumar Choudhary' },
    { id: 'sub_6', name: 'Manufacturing Practice', teacher: 'Dr. Shailendra kr Prashad' },
    { id: 'sub_7', name: 'Constitution Of India', teacher: 'Dr. Prem Nath Suman' }
];

let assignments = [];

// --- Auth ---
export async function handleGoogleLogin() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { 
            // Hardcoding the production URL for GitHub Pages
            redirectTo: 'https://wannabecr.github.io/taskboard/' 
        }
    });
    if (error) alert("Login Error: " + error.message);
}

// --- Assignment Actions ---
export async function addAssignment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const subject_id = formData.get('subject_id');
    const file = document.getElementById('question-file').files[0];

    let question_url = null;

    if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabaseClient.storage
            .from('assignment-pdfs')
            .upload(fileName, file);
        if (error) return alert("Upload failed: " + error.message);
        
        const { data: urlData } = supabaseClient.storage
            .from('assignment-pdfs')
            .getPublicUrl(fileName);
        question_url = urlData.publicUrl;
    }

    const { error } = await supabaseClient.from('assignments').insert([{
        title,
        subject_id,
        question_url,
        completed: false
    }]);

    if (error) alert(error.message);
    else {
        e.target.reset();
        initApp();
    }
}

async function initApp() {
    const { data, error } = await supabaseClient.from('assignments').select('*');
    if (error) return console.error(error);
    assignments = data || [];
    renderAssignments();
}

function renderAssignments() {
    const grid = document.getElementById('subjects-grid');
    if (!grid) return;

    grid.innerHTML = assignments.map(a => {
        const sub = PREDEFINED_SUBJECTS.find(s => s.id === a.subject_id) || { name: 'Custom', teacher: 'Unknown' };
        return `
            <div class="glass-panel p-5 rounded-2xl border border-borderLine">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-textMain">${sub.name}</h3>
                        <p class="text-[10px] text-textMuted">${sub.teacher}</p>
                    </div>
                    ${a.question_url ? `<a href="${a.question_url}" target="_blank" class="text-primary"><i class="ph ph-file-pdf text-xl"></i></a>` : ''}
                </div>
                <div class="flex items-center gap-3 p-3 bg-base/50 rounded-xl border border-borderLine">
                    <i class="ph ${a.completed ? 'ph-check-circle text-primary' : 'ph-circle text-textMuted'} text-lg"></i>
                    <span class="text-sm ${a.completed ? 'line-through opacity-50' : ''}">${a.title}</span>
                </div>
            </div>
        `;
    }).join('');
}

// --- Global Exports ---
window.handleGoogleLogin = handleGoogleLogin;
window.addAssignment = addAssignment;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) initApp();
});
// Add these exports at the bottom of your main.js if they aren't there
export async function toggleComplete(id, currentStatus) {
    const { error } = await supabaseClient
        .from('assignments')
        .update({ completed: !currentStatus })
        .eq('id', id);
    if (error) alert(error.message);
    else initApp();
}

export async function deleteTask(id) {
    if (!confirm("Delete this assignment?")) return;
    const { error } = await supabaseClient
        .from('assignments')
        .delete()
        .eq('id', id);
    if (error) alert(error.message);
    else initApp();
}

window.toggleComplete = toggleComplete;
window.deleteTask = deleteTask;
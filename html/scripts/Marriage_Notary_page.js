import { apiFetch } from './utils.js';



// Sidebar toggle for mobile
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
sidebarToggle.addEventListener('click', () => {
	sidebar.classList.toggle('open');
});

// Close sidebar on click outside (mobile)
document.addEventListener('click', (e) => {
	if (window.innerWidth < 900 && sidebar.classList.contains('open')) {
		if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
			sidebar.classList.remove('open');
		}
	}
});

// Demo logs and contracts (replace with API calls as needed)
const demoLogs = [
	{ text: 'Marriage Registered at 14:30', icon: 'fa-circle-dot' },
	{ text: 'Divorce Registered at 10:12', icon: 'fa-circle-dot' },
	{ text: 'Profile Updated at 09:00', icon: 'fa-circle-dot' }
];
const demoContracts = [
	{ id: 12345, husbandId: '10000000001', wifeId: '20000000002', date: '2024-03-23' },
	{ id: 12346, husbandId: '10000000003', wifeId: '20000000004', date: '2024-03-22' },
	{ id: 12347, husbandId: '10000000005', wifeId: '20000000006', date: '2024-03-21' }
];

function renderLogs() {
	const logsDiv = document.getElementById('sidebarLogs');
	logsDiv.innerHTML = demoLogs.map(log => `<div class=\"log-entry\"><i class=\"fa-solid ${log.icon}\"></i> ${log.text}</div>`).join('');
}
function renderContracts(contracts) {
	const list = document.getElementById('contractsList');
	if (!contracts.length) {
		list.innerHTML = '<li class=\"contract-item\">No contracts found.</li>';
		return;
	}
	list.innerHTML = contracts.map(c => `<li class=\"contract-item\">#${c.id} - Husband: ${c.husbandId}, Wife: ${c.wifeId}, ${c.date}</li>`).join('');
}

// Search/filter logic
const contractSearch = document.getElementById('contractSearch');
const contractClear = document.getElementById('contractClear');
contractSearch.addEventListener('input', () => {
	const q = contractSearch.value.trim().toLowerCase();
	if (!q) {
		renderContracts(demoContracts);
		return;
	}
	const filtered = demoContracts.filter(c =>
		c.husbandId.includes(q) ||
		c.wifeId.includes(q) ||
		c.date.includes(q)
	);
	renderContracts(filtered);
});
contractClear.addEventListener('click', () => {
	contractSearch.value = '';
	renderContracts(demoContracts);
});

// Initial render
renderLogs();
renderContracts(demoContracts);

function showTab(tab) {
	document.getElementById('marriage').style.display = tab === 'marriage' ? '' : 'none';
	document.getElementById('divorce').style.display = tab === 'divorce' ? '' : 'none';
	document.getElementById('marriageTabBtn').classList.toggle('active', tab === 'marriage');
	document.getElementById('divorceTabBtn').classList.toggle('active', tab === 'divorce');
}
document.getElementById('marriageTabBtn').addEventListener('click', () => showTab('marriage'));
document.getElementById('divorceTabBtn').addEventListener('click', () => showTab('divorce'));

	// Marriage form submission
	document.getElementById('marriageForm').onsubmit = async function(e) {
		e.preventDefault();
		const form = e.target;
		const data = {
			husbandId: Number(form.husbandId.value),
			wifeId: Number(form.wifeId.value),
			marriageDate: form.marriageDate.value,
			dowryAmount: Number(form.dowryAmount.value),
			witness1Id: Number(form.witness1Id.value),
			witness2Id: Number(form.witness2Id.value)
		};

		const res = await apiFetch('/api/Marriage_Notary/new_marriage', 'POST', data);
		const resultDiv = document.getElementById('marriageResult');
		resultDiv.classList.remove('error', 'success');
		resultDiv.classList.add(res.error ? 'error' : 'success');
		resultDiv.innerText = JSON.stringify(res);
	};
 
	// Divorce form submission
	document.getElementById('divorceForm').onsubmit = async function(e) {
		e.preventDefault();
		const form = e.target;
		const data = { 
			marriageId: Number(form.marriageId.value),
			endReason: form.endReason.value,
			endDate: form.endDate.value
		};
		console.log(data);
		
		const res = await apiFetch('/api/Marriage_Notary/divorce', 'PATCH', data);
		const resultDiv = document.getElementById('divorceResult');
		resultDiv.classList.remove('error', 'success');
		resultDiv.classList.add(res.error ? 'error' : 'success');
		resultDiv.innerText = res.message || res.error;
	};

	//logs
	

	// Prevent wheel from changing number input values
	document.querySelectorAll('input[type="number"]').forEach(input => {
		input.addEventListener('wheel', (e) => {
			e.preventDefault();
			input.blur();
		}, { passive: false });
	});
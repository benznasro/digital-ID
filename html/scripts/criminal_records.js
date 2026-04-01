import { apiFetch } from './utils.js';

//  Sidebar Toggle (mobile) 
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
	sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
	if (window.innerWidth < 900 && sidebar.classList.contains('open')) {
		if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
			sidebar.classList.remove('open');
		}
	}
});

//  Result Helper 
function showResult(elementId, res) {
	const div = document.getElementById(elementId);
	div.classList.remove('error', 'success');
	div.classList.add(res.error ? 'error' : 'success');
	div.innerText = res.message || res.error || 'Unknown response';
}

//  Sidebar Logs 
async function loadSidebarLogs() {
	const logsDiv = document.getElementById('sidebarLogs');
	try {
		const logs = await apiFetch('/api/criminal_records/Logs', 'GET', null);

		if (!logs || !logs.length) {
			logsDiv.innerHTML = '<div class="log-entry"><i class="fa-solid fa-circle-dot"></i> No logs yet.</div>';
			return;
		}

		logsDiv.innerHTML = logs.slice(0, 5).map(log => {
			const icon  = log.gander === true ? 'fa-ring' : 'fa-gavel';
			const time  = new Date(log.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			return `<div class="log-entry">
				<i class="fa-solid ${icon}"></i>
				${log.last_name} ${log.first_name} #${log.birth_record_id} at ${time}
			</div>`;
		}).join('');

	} catch (err) {
		logsDiv.innerHTML = '<div class="log-entry" style="color:#c62828">Failed to load logs.</div>';
	}
}

//  Sidebar Contracts 
let allContracts = [];

async function loadSidebarContracts() {
	const list = document.getElementById('contractsList');
	list.innerHTML = '<li class="contract-item"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</li>';
	try {
		const logs = await apiFetch('/api/criminal_records/Logs', 'GET', null);
		allContracts = logs || [];
		applyFilters();
	} catch (err) {
		list.innerHTML = '<li class="contract-item" style="color:#c62828">Failed to load contracts.</li>';
	}
}

function renderContracts(contracts) {
	const list = document.getElementById('contractsList');

	// update count 
	document.getElementById('contractCount').textContent = contracts.length;

	if (!contracts.length) {
		list.innerHTML = '<li class="contract-item no-results"><i class="fa-solid fa-inbox"></i> No contracts found.</li>';
		return;
	}

	list.innerHTML = contracts.map(c => {
		const iscriminal_records = c.operation === 'INSERT';
		const label      = iscriminal_records ? 'criminal_records' : 'Divorce';
		const badgeClass = iscriminal_records ? 'badge-iscriminal_records' : 'badge-divorce';
		const date       = new Date(c.changed_at).toLocaleDateString();
		return `<li class="contract-item">
			<div class="contract-item-header">
				<span class="contract-badge ${badgeClass}"> ${label}</span>
				<span class="contract-id">#${c.criminal_records_id}</span>
			</div>
			<div class="contract-names">
				${c.husband_name || 'Unknown'} &amp; ${c.wife_name || 'Unknown'}
			</div>
			<div class="contract-date"><i class="fa-regular fa-calendar"></i> ${date}</div>
		</li>`;
	}).join('');
}

//  Apply All Filters 
function applyFilters() {
	const search     = document.getElementById('contractSearch').value.trim().toLowerCase();
	const typeFilter = document.getElementById('filterType').value;    
	const dateFrom   = document.getElementById('filterDateFrom').value; 
	const dateTo     = document.getElementById('filterDateTo').value;   

	let filtered = allContracts;

	// 1 — filter by type
	if (typeFilter !== 'all') {
		filtered = filtered.filter(c => c.operation === typeFilter);
	}

	// 2 — filter by date range
	if (dateFrom) {
		const from = new Date(dateFrom);
		filtered = filtered.filter(c => new Date(c.changed_at) >= from);
	}
	if (dateTo) {
		const to = new Date(dateTo);
		to.setHours(23, 59, 59); // include the full end day
		filtered = filtered.filter(c => new Date(c.changed_at) <= to);
	}

	// 3 — filter by search text
	if (search) {
		filtered = filtered.filter(c =>
			String(c.marriage_id).includes(search) ||
			(c.husband_name || '').toLowerCase().includes(search) ||
			(c.wife_name    || '').toLowerCase().includes(search)
		);
	}

	renderContracts(filtered);
}

// wire up all filter inputs to applyFilters
document.getElementById('contractSearch').addEventListener('input',  applyFilters);
//document.getElementById('filterType').addEventListener('change',     applyFilters);
document.getElementById('filterDateFrom').addEventListener('change', applyFilters);
document.getElementById('filterDateTo').addEventListener('change',   applyFilters);

// clear/reset all filters
document.getElementById('contractClear').addEventListener('click', () => {
	document.getElementById('contractSearch').value  = '';
	document.getElementById('filterType').value      = 'all';
	document.getElementById('filterDateFrom').value  = '';
	document.getElementById('filterDateTo').value    = '';
	loadSidebarContracts(); // re-fetch from API
});

//  criminal records Form 
document.getElementById('criminal_recordsForm').onsubmit = async function(e) {
	e.preventDefault();
	const form = e.target;
	const data = {
		personId:    Number(form.personId.value),
        caseNumber:       form.caseNumber.value,
        status:       form.status.value,
        violationType:       form.violationType.value,
        disposition:       form.disposition.value,
        description:       form.description.value,
		occurrenceDate: form.occurrenceDate.value,
        filingDate: form.filing_date.value,
		fineAmount:   Number(form.fineAmount.value),
        sentenceDetails:   form.sentenceDetails.value,
        locationDetails:   form.locationDetails.value,
	};
console.log(data);
	const res = await apiFetch('/api/criminal_records/create', 'POST', data);
	showResult('criminal_recordsResult', res);

	if (!res.error) {
		loadSidebarLogs();
		loadSidebarContracts();
	}
};

//  Prevent wheel on number inputs 
document.querySelectorAll('input[type="number"]').forEach(input => {
	input.addEventListener('wheel', (e) => {
		e.preventDefault();
		input.blur();
	}, { passive: false });
});

//  Init 
//loadSidebarLogs();
//loadSidebarContracts();
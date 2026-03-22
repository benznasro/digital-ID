import { apiFetch } from './utils.js';


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

	// Prevent wheel from changing number input values
	document.querySelectorAll('input[type="number"]').forEach(input => {
		input.addEventListener('wheel', (e) => {
			e.preventDefault();
			input.blur();
		}, { passive: false });
	});
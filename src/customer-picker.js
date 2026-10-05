const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

export function customerCard(state) {
  return `<section class="card customer-card" aria-labelledby="customer-heading"><div class="section-heading"><h2 id="customer-heading">Customer</h2>${state.customer ? '<button type="button" id="clear-customer" class="text-button">Clear</button>' : ''}</div>
    <div class="customer-picker"><label class="field" for="customer-search">Customer name or phone number</label><input id="customer-search" type="search" maxlength="80" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="customer-options" placeholder="Search by name or phone" value="${escape(state.customerSearch)}" />
    <div id="customer-options" class="service-options customer-options" role="listbox" aria-label="Customers" hidden></div></div>
    <p class="helper" role="status">${state.customer ? `${escape(state.customer.name)} · ${escape(state.customer.phone)}` : 'Search and select a customer.'}</p></section>`;
}

export function bindCustomer({ state, searchCustomers, markChanged, render }) {
  const input = document.querySelector('#customer-search');
  const list = document.querySelector('#customer-options');
  const picker = input.parentElement;
  let matches = [], active = -1, request = 0, timer;
  const close = () => { request++; clearTimeout(timer); list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
  const select = customer => { state.customer = customer; state.customerSearch = ''; close(); markChanged(); render(); };
  async function search() {
    const current = ++request;
    const text = input.value;
    state.customerSearch = text;
    active = -1; matches = []; input.removeAttribute('aria-activedescendant');
    if (!text.trim()) { close(); return; }
    list.hidden = false; input.setAttribute('aria-expanded', 'true');
    list.innerHTML = '<p class="helper" role="status">Searching customers…</p>';
    try {
      const result = await searchCustomers(text);
      if (current !== request || !input.isConnected) return;
      matches = result;
      list.innerHTML = matches.length ? matches.map((customer, index) => `<button type="button" role="option" id="customer-option-${index}" aria-selected="false" data-customer="${index}"><span>${escape(customer.name)}</span><small>${escape(customer.phone)}</small></button>`).join('') : '<p class="helper" role="status">No matching customer. Try another name or number.</p>';
      list.querySelectorAll('[data-customer]').forEach(button => {
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', () => select(matches[Number(button.dataset.customer)]));
      });
    } catch {
      if (current === request && input.isConnected) list.innerHTML = '<p class="helper" role="status">Could not search customers. Try again.</p>';
    }
  }
  input.addEventListener('input', () => { request++; matches = []; active = -1; list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); state.customerSearch = input.value; clearTimeout(timer); timer = setTimeout(search, 150); });
  input.addEventListener('focus', search);
  picker.addEventListener('focusout', event => { if (!picker.contains(event.relatedTarget)) close(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); if (!matches.length || list.hidden) return;
      active = active < 0 ? (event.key === 'ArrowDown' ? 0 : matches.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      list.querySelectorAll('[role="option"]').forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
      const option = list.querySelectorAll('[role="option"]')[active]; input.setAttribute('aria-activedescendant', option.id); option.scrollIntoView({ block: 'nearest' });
    }
    if (event.key === 'Enter') { event.preventDefault(); if (active >= 0 && !list.hidden) select(matches[active]); }
  });
  document.querySelector('#clear-customer')?.addEventListener('click', () => { state.customer = null; state.customerSearch = ''; markChanged(); render(); document.querySelector('#customer-search').focus(); });
}

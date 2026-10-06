const fs = require('fs');

const scriptPath = 'Sistema Luz Gastronomia/outputs/luz-gastronomia/script.js';
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Find the index of "let comboType = 'mix'" and the end of the combo logic
const startIndex = scriptContent.indexOf("let comboType = 'mix', comboSelection = [];");
const endIndex = scriptContent.indexOf("const accountStorageKey = 'luz-gastronomia-customer';");

if (startIndex !== -1 && endIndex !== -1) {
  const newScriptBlock = `const comboSelectionArea = document.querySelector('#comboSelectionArea');
let comboType = null, comboSelection = [];
const comboOptions = document.querySelector('#comboOptions'), comboCount = document.querySelector('#comboCount'), comboInstruction = document.querySelector('#comboInstruction'), comboPrice = document.querySelector('#comboPrice'), comboHint = document.querySelector('#comboHint'), addCombo = document.querySelector('#addCombo');

const combosList = {
  '10m': { marmita: 10, creme: 0, price: 149.90, label: '10 Marmitas' },
  '15m': { marmita: 15, creme: 0, price: 194.90, label: '15 Marmitas' },
  '20m': { marmita: 20, creme: 0, price: 249.90, label: '20 Marmitas' },
  '10c': { marmita: 0, creme: 10, price: 129.90, label: '10 Cremes' },
  '20c': { marmita: 0, creme: 20, price: 239.90, label: '20 Cremes' },
  '5m5c': { marmita: 5, creme: 5, price: 139.90, label: '5 Marmitas + 5 Cremes' },
  '10m5c': { marmita: 10, creme: 5, price: 189.90, label: '10 Marmitas + 5 Cremes' },
  '10m10c': { marmita: 10, creme: 10, price: 259.90, label: '10 Marmitas + 10 Cremes' },
  '20m20c': { marmita: 20, creme: 20, price: 359.90, label: '20 Marmitas + 20 Cremes' }
};

function comboRules() { return comboType ? combosList[comboType] : null; }

function renderCombo() {
  const rules = comboRules();
  if (!rules) {
    if (comboSelectionArea) comboSelectionArea.style.display = 'none';
    return;
  }
  if (comboSelectionArea) comboSelectionArea.style.display = 'block';

  const visible = comboChoices.filter(choice => {
    if (rules.marmita > 0 && rules.creme > 0) return true;
    if (rules.marmita > 0) return choice.kind === 'marmita';
    return choice.kind === 'creme';
  });

  const marmitas = comboSelection.filter(choice => choice.kind === 'marmita').length;
  const cremes = comboSelection.filter(choice => choice.kind === 'creme').length;
  const complete = marmitas === rules.marmita && cremes === rules.creme;

  comboOptions.innerHTML = visible.map(choice => {
    const count = comboSelection.filter(item => item === choice).length;
    const sameKind = choice.kind === 'marmita' ? marmitas : cremes;
    const max = rules[choice.kind];
    const index = comboChoices.indexOf(choice);
    return \`<div class="combo-option \${count ? 'selected' : ''}"><span><small>\${choice.kind === 'marmita' ? 'marmita · 400g' : 'creme · 300g'}</small><strong>\${choice.name}</strong></span><div class="combo-quantity"><button type="button" data-action="decrease" data-choice="\${index}" aria-label="Diminuir \${choice.name}" \${count === 0 ? 'disabled' : ''}>−</button><b>\${count}</b><button type="button" data-action="increase" data-choice="\${index}" aria-label="Aumentar \${choice.name}" \${sameKind >= max ? 'disabled' : ''}>+</button></div></div>\`;
  }).join('');

  comboCount.textContent = rules.marmita && rules.creme ? \`\${marmitas} de \${rules.marmita} marmitas · \${cremes} de \${rules.creme} cremes\` : rules.marmita ? \`\${marmitas} de \${rules.marmita} marmitas\` : \`\${cremes} de \${rules.creme} cremes\`;
  comboInstruction.textContent = \`Escolha \${rules.label}\`;
  comboPrice.textContent = money(rules.price);
  comboHint.textContent = complete ? 'Tudo certo! Seu combo está pronto para ir à sacola.' : \`Faltam \${Math.max(0, rules.marmita - marmitas) + Math.max(0, rules.creme - cremes)} escolhas para completar.\`;
  addCombo.disabled = !complete;
}

document.querySelectorAll('.combo-tab').forEach(tab => tab.addEventListener('click', () => { comboType = tab.dataset.combo; comboSelection = []; document.querySelectorAll('.combo-tab').forEach(button => button.classList.toggle('active', button === tab)); renderCombo(); setTimeout(() => { if (comboSelectionArea) { const y = comboSelectionArea.getBoundingClientRect().top + window.scrollY - 100; window.scrollTo({top: y, behavior: 'smooth'}); } }, 50); }));
comboOptions.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; const choice = comboChoices[Number(button.dataset.choice)], rules = comboRules(); if (button.dataset.action === 'increase') { const sameKind = comboSelection.filter(item => item.kind === choice.kind).length; if (sameKind < rules[choice.kind]) comboSelection.push(choice); } else { const index = comboSelection.lastIndexOf(choice); if (index !== -1) comboSelection.splice(index, 1); } renderCombo(); });
document.querySelector('#resetCombo').addEventListener('click', () => { comboSelection = []; renderCombo(); }); addCombo.addEventListener('click', () => { const rules = comboRules(); cart.push({ name: \`Combo: \${rules.label}\`, price: rules.price }); resetDiscountReservation(); renderCart(); toggleCart(true); }); renderCombo();

`;

  scriptContent = scriptContent.slice(0, startIndex) + newScriptBlock + scriptContent.slice(endIndex);
  fs.writeFileSync(scriptPath, scriptContent, 'utf8');
  console.log("Replaced successfully!");
} else {
  console.log("Indexes not found");
}


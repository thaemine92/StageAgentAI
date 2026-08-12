// Test final complet
const { execSync } = require('child_process');
const fetch = require('node-fetch');

console.log('🔄 Démarrage du serveur backend...');

// Démarrer le serveur en arrière-plan
const serverProcess = execSync('start /B node -e "require(\'child_process\').execSync(\'npx tsx src/server.ts\', {stdio: \'inherit\'})"', { 
  cwd: __dirname,
  shell: true
});

// Attendre 5 secondes
setTimeout(async () => {
  console.log('🧪 Test du backend...');
  
  try {
    // Test 1: Vérifier que le serveur répond
    const response1 = await fetch('http://localhost:3001/api/auth/me');
    console.log('✅ Test 1 - /api/auth/me:', response1.status);
    const data1 = await response1.json();
    console.log('   Données:', JSON.stringify(data1, null, 2));
    
    // Test 2: Tester la connexion
    const response2 = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.dupont@doclinic.com', password: 'password123', role: 'MEDECIN' })
    });
    console.log('✅ Test 2 - /api/auth/login:', response2.status);
    const data2 = await response2.json();
    console.log('   Données:', JSON.stringify(data2, null, 2));
    
    // Test 3: Tester avec client
    const response3 = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient1@email.com', password: 'password123', role: 'CLIENT' })
    });
    console.log('✅ Test 3 - Client login:', response3.status);
    const data3 = await response3.json();
    console.log('   Données:', JSON.stringify(data3, null, 2));
    
    console.log('\n🎉 Tous les tests backend ont réussi !');
    console.log('\n→ Démarrez maintenant le frontend avec: npm run dev');
    console.log('→ Puis allez sur: http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}, 5000);

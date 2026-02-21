import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database - Pizzeria Cirillo...');

  // Alle existierenden Produkte, Kategorien und Bestellungen löschen
  console.log('🗑️ Cleaning existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // ========== USERS ==========
  // Admin User erstellen
  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pazo.de' },
    update: {},
    create: {
      email: 'admin@pazo.de',
      passwordHash: adminPassword,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Bäcker User erstellen
  const baeckerPassword = await argon2.hash('baecker123');
  const baecker = await prisma.user.upsert({
    where: { email: 'baecker@pazo.de' },
    update: {},
    create: {
      email: 'baecker@pazo.de',
      passwordHash: baeckerPassword,
      name: 'Max Bäcker',
      role: Role.BAECKER,
    },
  });
  console.log('✅ Bäcker user created:', baecker.email);

  // Lieferant User erstellen
  const lieferantPassword = await argon2.hash('lieferant123');
  const lieferant = await prisma.user.upsert({
    where: { email: 'lieferant@pazo.de' },
    update: {},
    create: {
      email: 'lieferant@pazo.de',
      passwordHash: lieferantPassword,
      name: 'Lisa Lieferant',
      role: Role.LIEFERANT,
    },
  });
  console.log('✅ Lieferant user created:', lieferant.email);

  // Test Kunde erstellen
  const kundePassword = await argon2.hash('kunde123');
  const kunde = await prisma.user.upsert({
    where: { email: 'kunde@pazo.de' },
    update: {},
    create: {
      email: 'kunde@pazo.de',
      passwordHash: kundePassword,
      name: 'Test Kunde',
      role: Role.KUNDE,
    },
  });
  console.log('✅ Kunde user created:', kunde.email);

  // ========== KATEGORIEN ==========
  console.log('📁 Creating categories...');

  const catVorspeisen = await prisma.category.create({
    data: {
      name: 'Vorspeisen & Brot',
      slug: 'vorspeisen',
      description: 'Italienische Vorspeisen und frisches Pizzabrot',
      imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
      sortOrder: 1,
    },
  });

  const catInsalate = await prisma.category.create({
    data: {
      name: 'Insalate',
      slug: 'insalate',
      description: 'Frische Salate mit hausgemachtem Dressing',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      sortOrder: 2,
    },
  });

  const catPizza = await prisma.category.create({
    data: {
      name: 'Pizza',
      slug: 'pizza',
      description: 'Unsere Pizza wird frisch zubereitet und gut belegt mit Tomaten und Käse',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      sortOrder: 3,
    },
  });

  const catPasta = await prisma.category.create({
    data: {
      name: 'Pasta',
      slug: 'pasta',
      description: 'Unsere Pasta wird frisch zubereitet und heiß serviert',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
      sortOrder: 4,
    },
  });

  const catPesce = await prisma.category.create({
    data: {
      name: 'Pesce - Fischgerichte',
      slug: 'pesce',
      description: 'Alle Fischgerichte mit Pommes Frites und Salat',
      imageUrl: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400',
      sortOrder: 5,
    },
  });

  const catCarne = await prisma.category.create({
    data: {
      name: 'Carne - Fleischgerichte',
      slug: 'carne',
      description: 'Unsere panierten Schnitzel enthalten Weizenpanade. Alle Fleischgerichte mit Pommes Frites und Salat.',
      imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400',
      sortOrder: 6,
    },
  });

  const catBeilagen = await prisma.category.create({
    data: {
      name: 'Beilagen',
      slug: 'beilagen',
      description: 'Pommes und Saucen',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
      sortOrder: 7,
    },
  });

  const catGetraenke = await prisma.category.create({
    data: {
      name: 'Getränke',
      slug: 'getraenke',
      description: 'Erfrischende Getränke und alkoholfreie Softdrinks',
      imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
      sortOrder: 8,
    },
  });

  console.log('✅ Categories created');

  // ========== PRODUKTE ==========
  console.log('🍕 Creating products...');

  // ----- VORSPEISEN & BROT -----
  const vorspeisen = [
    { name: 'Italienische Vorspeise', description: 'Gemischte Spezialitäten', price: 9.60, imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400' },
    { name: 'Piadina', description: 'Italienisches Fladenbrot', price: 4.50, imageUrl: 'https://images.unsplash.com/photo-1619531040576-f9416740661b?w=400' },
    { name: 'Pizzapane Classico', description: 'Pizzabrot mit Kräutern und Olivenöl', price: 5.10, imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400' },
    { name: 'Pizzapane Mediterraneo', description: 'Pizzabrot mit Kräutern, Olivenöl und Weichkäse', price: 5.60, imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400' },
    { name: 'Pizzapane Pugliese', description: 'Pizzabrot mit Tomatenstückchen', price: 5.10, imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400' },
    { name: 'Pizzapanini', description: '5 kleine Pizzabrötchen', price: 5.10, imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400' },
  ];

  // ----- INSALATE (SALATE) -----
  const insalate = [
    { name: 'Beilagan-Salat', description: 'Grüner Salat, Tomaten', price: 4.30, imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
    { name: 'Gurkensalat', description: 'Frische Gurken', price: 5.90, imageUrl: 'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=400' },
    { name: 'Tomatensalat mit Weichkäse', description: 'Tomaten, Weichkäse', price: 6.70, imageUrl: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400' },
    { name: 'Salat Klein Italien', description: 'Grüner Salat, Käse, Tomaten', price: 6.70, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
    { name: 'Italienischer Salat', description: 'Grüner Salat, Tomaten, Paprika, Thunfisch', price: 7.70, imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400' },
    { name: 'Gemischter Salat', description: 'Grüner Salat, Käse, Zwiebeln, Tomaten, Thunfisch', price: 8.10, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
    { name: 'Vegetarischer Salat', description: 'Grüner Salat, Käse, Zwiebeln, Tomaten, Paprika, Gurken', price: 8.10, imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
    { name: 'Salat Canosa', description: 'Grüner Salat, Käse, Zwiebeln, Tomaten, Thunfisch, Ei', price: 8.10, imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400' },
    { name: 'Salat Della Casa', description: 'Grüner Salat, Käse, Tomaten, Gurken, Artischocken, Schinken, Oliven, Ei', price: 8.70, imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400' },
    { name: 'Insalata di Pollo', description: 'Grüner Salat, Weichkäse, Tomaten, Mais, Gurken, Ei, Hähnchenbruststreifen', price: 10.10, imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400' },
    { name: 'Salat Mediterrania', description: 'Grüner Salat, Weichkäse, Oliven, Gurken, Tomaten, Paprika, Artischocken, Zwiebeln', price: 10.10, imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
    { name: 'Caprese', description: 'Frische Tomaten, Mozzarella, Olivenöl und Pizzabrot', price: 9.70, imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400' },
    { name: 'Insalata Frutti di Mare', description: 'Grüner Salat mit Meeresfrüchten', price: 10.10, imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400' },
    { name: 'Grande Insalata con tutto', description: 'Grüner Salat, Käse, Zwiebeln, Gurken, Tomaten, Thunfisch, Paprika, Mais, Oliven, Schinken, Ei', price: 9.90, imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400' },
  ];

  // ----- PIZZA -----
  const pizzas = [
    { name: 'Pizza Margherita', description: 'Käse, Tomaten', price: 8.50, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Funghi', description: 'Pilze', price: 9.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Peperoni', description: 'Peperoniwurst', price: 9.40, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { name: 'Pizza Bimbo', description: 'Salami', price: 9.40, imageUrl: 'https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?w=400' },
    { name: 'Pizza Prosciutto', description: 'Schinken', price: 9.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Micca', description: 'Schinken, Salami', price: 10.30, imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400' },
    { name: 'Pizza Gobbo', description: 'Peperoniwurst, Pilze', price: 10.30, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Rustica', description: 'Salami, Pilze', price: 10.30, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Borromeo', description: 'Schinken, Zwiebeln', price: 10.30, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Hawaii', description: 'Schinken, Ananas', price: 10.30, imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400' },
    { name: 'Pizza Paesana', description: 'Schinken, Pilze', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Inferno', description: 'Peperoniwurst, Paprika, scharf', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { name: 'Pizza Mista', description: 'Peperoniwurst, Schinken, Salami, Pilze', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400' },
    { name: 'Pizza Vegetaria', description: 'Pilze, Paprika, Zwiebeln, Artischocken', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400' },
    { name: 'Pizza Quattro Stagioni', description: 'Schinken, Salami, Pilze, Artischocken', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Euro-Pizza', description: 'Schinken, Spinat, Ei, Artischocken', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Tonno', description: 'Thunfisch', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Popolare', description: 'Peperoniwurst, Rossinisauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { name: 'Pizza Sofia', description: 'Thunfisch, Zwiebel', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Capricciosa', description: 'Sardellen, Kapern, Oliven, Pilze, Oregano', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Peppe', description: 'Peperoniwurst, Thunfisch', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { name: 'Pizza Lupo', description: 'Pilze, Mais, Broccoli, Spinat', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400' },
    { name: 'Calzone', description: 'Peperoniwurst, Schinken, Salami', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1536964549204-cce9eab227bd?w=400' },
    { name: 'Pizza Sorpresa', description: 'Eine Überraschung für Sie', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Insieme', description: 'Nach Ihren Wünschen, bis 4 Beläge, auch mit Knoblauch', price: 11.10, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Bolo', description: 'Bolognese-Sauce', price: 9.50, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Al Salmone', description: 'Lachs, Zwiebeln', price: 11.90, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Klein-Italien', description: 'Peperoniwurst, Schinken, Thunfisch', price: 10.90, imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400' },
    { name: 'Pizza Frutti di Mare', description: 'Meeresfrüchte', price: 10.90, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Bolognese', description: 'Schinken, Salami, Pilze und Bolognese-Sauce', price: 10.90, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Formaggi', description: '3 verschiedene Käsesorten', price: 10.90, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
    { name: 'Pizza Viagra', description: 'Peperoniwurst, Spinat, Knoblauch, scharf', price: 10.60, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { name: 'Pizza Speciale', description: 'Schinken, Salami, Pilze, Paprika, Zwiebeln', price: 11.30, imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400' },
    { name: 'Pizza Originale', description: 'Frische Tomaten und Mozzarella', price: 11.90, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Parma', description: 'Frische Tomaten, Mozzarella, Parmaschinken', price: 11.90, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Capitano', description: 'Shrimps, Spinat, Knoblauch', price: 10.80, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza senza Glutine (Glutenfrei)', description: 'Käse, Tomaten (jede weitere Zutat +1,00€)', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
    { name: 'Pizza Celentano', description: 'Salami, Schinken, Ei, Spinat', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400' },
    { name: 'Pizzapasta', description: 'Nudel und Bolognesesauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { name: 'Pizza Famiglia 50x50cm', description: 'Peperoniwurst, Schinken, Salami, Pilze (5-6 Personen)', price: 38.00, imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400' },
  ];

  // ----- PASTA -----
  const pastas = [
    { name: 'Spaghetti Aglio e Olio', description: 'Knoblauch und Olivenöl', price: 9.60, imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
    { name: 'Spaghetti Tomatensauce', description: 'Klassische Tomatensauce', price: 9.90, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Spaghetti Al Salmone', description: 'Mit Lachs', price: 10.80, imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
    { name: 'Spaghetti Sahnesauce', description: 'Cremige Sahnesauce', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
    { name: 'Spaghetti Bolognese', description: 'Klassische Bolognesesauce', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400' },
    { name: 'Spaghetti Rossinisauce', description: 'Schinken, Sahne', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
    { name: 'Spaghetti Carbonara', description: 'Ei, Speck, Parmesan', price: 11.20, imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400' },
    { name: 'Spaghetti Gorgonzola', description: 'Gorgonzolasauce', price: 11.20, imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
    { name: 'Spaghetti Frutti di Mare', description: 'Meeresfrüchte', price: 15.60, imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
    { name: 'Spaghetti Pesto', description: 'Pesto grün oder rot', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400' },
    { name: "Spaghetti all'Arrabbiata", description: 'Scharfe Tomatensauce', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
    { name: 'Tortellini Tomatensauce', description: 'Gefüllte Pasta mit Tomatensauce', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400' },
    { name: 'Tortellini Bolognese', description: 'Gefüllte Pasta mit Bolognesesauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400' },
    { name: 'Tortellini Sahnesauce', description: 'Gefüllte Pasta mit Sahnesauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400' },
    { name: 'Tortellini Gorgonzola', description: 'Gefüllte Pasta mit Gorgonzolasauce', price: 11.40, imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400' },
    { name: 'Maccheroni Tomatensauce', description: 'Röhrennudeln mit Tomatensauce', price: 9.90, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Maccheroni Bolognese', description: 'Röhrennudeln mit Bolognesesauce', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Maccheroni Al Salmone', description: 'Röhrennudeln mit Lachs', price: 11.80, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Maccheroni Sahnesauce', description: 'Röhrennudeln mit Sahnesauce', price: 10.20, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Maccheroni Gorgonzola', description: 'Röhrennudeln mit Gorgonzolasauce', price: 11.20, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Combinazione Tomatensauce', description: 'Verschiedene Nudel und Soßen', price: 10.30, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Combinazione Bolognese', description: 'Verschiedene Nudel mit Bolognesesauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Gnocchi Tomatensauce', description: 'Kartoffelnocken mit Tomatensauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400' },
    { name: 'Gnocchi Bolognese', description: 'Kartoffelnocken mit Bolognesesauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400' },
    { name: 'Gnocchi Sahnesauce', description: 'Kartoffelnocken mit Sahnesauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400' },
    { name: 'Gnocchi Gorgonzola', description: 'Kartoffelnocken mit Gorgonzolasauce', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400' },
    { name: 'Lasagne', description: 'Klassische Lasagne', price: 10.10, imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400' },
    { name: 'Tris', description: 'Verschiedene Nudel und Soßen', price: 11.70, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Pasta della Casa', description: 'Broccoli, Spinat, Pilze, Tomatensauce, Sahne', price: 10.40, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
    { name: 'Cannelloni', description: 'Gefüllte Nudelrollen', price: 10.10, imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400' },
  ];

  // ----- PESCE (FISCH) -----
  const pesce = [
    { name: 'Calamari Fritti', description: 'Tintenfischringe mit Pommes Frites und Salat', price: 13.70, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400' },
  ];

  // ----- CARNE (FLEISCH) -----
  const carne = [
    { name: 'Schnitzel Naturale', description: 'Naturschnitzel mit Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Schnitzel Hawaii', description: 'Schinken, Ananas, Käse mit Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1599587289781-fda0bd8e6fe1?w=400' },
    { name: 'Schnitzel Sorpresa', description: 'Eine Überraschung mit Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Schnitzel Cipolla', description: 'Zwiebelschnitzel mit Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Schnitzel Gorgonzola', description: 'Mit Gorgonzolasauce, Pommes Frites und Salat', price: 15.30, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Kinderschnitzel oder Chicken Nuggets', description: 'Für die Kleinen mit Pommes Frites', price: 10.50, imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400' },
    { name: 'Rahmschnitzel', description: 'Mit Rahmsauce, Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Putenschnitzel', description: 'Paniert mit Pommes Frites und Salat', price: 14.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Inpanata Schnitzel', description: 'Paniert mit Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Schnitzel Parmesan', description: 'Fleisch-Sahne-Sauce, Schinken mit Käse überbacken, Pommes und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400' },
    { name: 'Schnitzel Bolognese', description: 'Mit Fleischsoße, Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Schnitzel Milanese', description: 'Käse-Sahne-Sauce, Schinken mit Käse überbacken, Pommes und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400' },
    { name: 'Schnitzel Cacciatore', description: 'Jäger Art mit Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
    { name: 'Schnitzel Zingaro', description: 'Paprika Art mit Pommes Frites und Salat', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400' },
  ];

  // ----- BEILAGEN -----
  const beilagen = [
    { name: 'Portion Pommes', description: 'Knusprige Pommes Frites', price: 5.40, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
    { name: 'Mayonnaise oder Ketchup', description: 'Sauce nach Wahl', price: 1.00, imageUrl: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400' },
    { name: 'Portion Pommes mit Sauce', description: 'Pommes mit Sauce nach Wahl', price: 7.80, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
  ];

  // ----- GETRÄNKE -----
  const getraenke = [
    { name: 'Cola 0,33l', description: 'Erfrischende Cola', price: 2.50, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
    { name: 'Cola 0,5l', description: 'Erfrischende Cola im großen Glas', price: 3.50, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
    { name: 'Fanta 0,33l', description: 'Fruchtige Orangenlimonade', price: 2.50, imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400' },
    { name: 'Fanta 0,5l', description: 'Fruchtige Orangenlimonade im großen Glas', price: 3.50, imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400' },
    { name: 'Sprite 0,33l', description: 'Erfrischende Zitronenlimonade', price: 2.50, imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400' },
    { name: 'Sprite 0,5l', description: 'Erfrischende Zitronenlimonade im großen Glas', price: 3.50, imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400' },
    { name: 'Wasser still 0,5l', description: 'Stilles Mineralwasser', price: 2.00, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
    { name: 'Wasser medium 0,5l', description: 'Mineralwasser mit wenig Kohlensäure', price: 2.00, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
    { name: 'Wasser sprudel 0,5l', description: 'Mineralwasser mit Kohlensäure', price: 2.00, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
    { name: 'Apfelschorle 0,5l', description: 'Erfrischende Apfelschorle', price: 3.00, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400' },
    { name: 'Orangensaft 0,2l', description: 'Frisch gepresster Orangensaft', price: 3.50, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400' },
    { name: 'Apfelsaft 0,2l', description: 'Naturtrüber Apfelsaft', price: 3.00, imageUrl: 'https://images.unsplash.com/photo-1576673442511-7e39b6545c87?w=400' },
    { name: 'Eistee Pfirsich 0,5l', description: 'Erfrischender Eistee mit Pfirsichgeschmack', price: 3.00, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
    { name: 'Eistee Zitrone 0,5l', description: 'Erfrischender Eistee mit Zitronengeschmack', price: 3.00, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
    { name: 'Espresso', description: 'Italienischer Espresso', price: 2.00, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400' },
    { name: 'Cappuccino', description: 'Espresso mit aufgeschäumter Milch', price: 3.00, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400' },
    { name: 'Latte Macchiato', description: 'Espresso mit viel Milch und Milchschaum', price: 3.50, imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400' },
    { name: 'Bier vom Fass 0,3l', description: 'Frisch gezapftes Bier', price: 3.50, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400' },
    { name: 'Bier vom Fass 0,5l', description: 'Frisch gezapftes Bier', price: 4.50, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400' },
    { name: 'Weißwein 0,2l', description: 'Italienischer Hauswein weiß', price: 4.00, imageUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400' },
    { name: 'Rotwein 0,2l', description: 'Italienischer Hauswein rot', price: 4.00, imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400' },
  ];

  // Produkte erstellen
  let sortOrder = 1;

  // Vorspeisen
  for (const item of vorspeisen) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catVorspeisen.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Insalate
  sortOrder = 1;
  for (const item of insalate) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catInsalate.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Pizza
  sortOrder = 1;
  for (const item of pizzas) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catPizza.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Pasta
  sortOrder = 1;
  for (const item of pastas) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catPasta.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Pesce
  sortOrder = 1;
  for (const item of pesce) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catPesce.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Carne
  sortOrder = 1;
  for (const item of carne) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catCarne.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Beilagen
  sortOrder = 1;
  for (const item of beilagen) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catBeilagen.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Getränke
  sortOrder = 1;
  for (const item of getraenke) {
    await prisma.product.create({
      data: {
        ...item,
        categoryId: catGetraenke.id,
        sortOrder: sortOrder++,
      },
    });
  }

  // Zählen
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();

  console.log(`✅ ${categoryCount} categories created`);
  console.log(`✅ ${productCount} products created`);
  console.log('🎉 Seeding completed - Pizzeria Cirillo is ready!');
  console.log('\n📧 Test-Logins:');
  console.log('   Admin: admin@pazo.de / admin123');
  console.log('   Bäcker: baecker@pazo.de / baecker123');
  console.log('   Lieferant: lieferant@pazo.de / lieferant123');
  console.log('   Kunde: kunde@pazo.de / kunde123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

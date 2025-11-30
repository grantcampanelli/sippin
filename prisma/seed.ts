import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Real wine brands with their actual top products
const wineBrandsData = [
  {
    name: 'Robert Mondavi',
    country: 'United States',
    website: 'https://www.robertmondaviwinery.com',
    description: 'Founded in 1966, Robert Mondavi Winery helped establish Napa Valley as a world-class wine region.',
    products: [
      { name: 'Cabernet Sauvignon Reserve', vintage: '2020', varietal: 'Cabernet Sauvignon', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Fumé Blanc', vintage: '2022', varietal: 'Sauvignon Blanc', region: 'Napa Valley', style: 'White', abv: 13.5 },
      { name: 'Pinot Noir', vintage: '2021', varietal: 'Pinot Noir', region: 'Carneros', style: 'Red', abv: 14.0 },
      { name: 'Merlot', vintage: '2020', varietal: 'Merlot', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Chardonnay Reserve', vintage: '2021', varietal: 'Chardonnay', region: 'Carneros', style: 'White', abv: 14.0 },
      { name: 'Sauvignon Blanc', vintage: '2023', varietal: 'Sauvignon Blanc', region: 'Napa Valley', style: 'White', abv: 13.5 },
      { name: 'Zinfandel', vintage: '2021', varietal: 'Zinfandel', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Moscato d\'Oro', vintage: '2022', varietal: 'Muscat', region: 'Napa Valley', style: 'Dessert', sweetness: 'Sweet', abv: 12.5 },
      { name: 'Rosé', vintage: '2023', varietal: 'Pinot Noir', region: 'Carneros', style: 'Rosé', abv: 13.0 },
      { name: 'Sparkling Wine', vintage: 'NV', varietal: 'Champagne Blend', region: 'Napa Valley', style: 'Sparkling', abv: 12.5 },
    ],
  },
  {
    name: 'Silver Oak',
    country: 'United States',
    website: 'https://www.silveroak.com',
    description: 'Silver Oak Cellars is known for producing exceptional Cabernet Sauvignon from Napa Valley and Alexander Valley.',
    products: [
      { name: 'Napa Valley Cabernet Sauvignon', vintage: '2019', varietal: 'Cabernet Sauvignon', region: 'Napa Valley', style: 'Red', abv: 14.2 },
      { name: 'Alexander Valley Cabernet Sauvignon', vintage: '2019', varietal: 'Cabernet Sauvignon', region: 'Alexander Valley', style: 'Red', abv: 14.1 },
      { name: 'Twomey Merlot', vintage: '2020', varietal: 'Merlot', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Twomey Pinot Noir', vintage: '2021', varietal: 'Pinot Noir', region: 'Russian River Valley', style: 'Red', abv: 14.0 },
      { name: 'Twomey Sauvignon Blanc', vintage: '2023', varietal: 'Sauvignon Blanc', region: 'Napa Valley', style: 'White', abv: 13.5 },
      { name: 'Overture', vintage: 'NV', varietal: 'Cabernet Sauvignon', region: 'Napa Valley', style: 'Red', abv: 14.0 },
      { name: 'Timeless', vintage: 'NV', varietal: 'Cabernet Sauvignon', region: 'Alexander Valley', style: 'Red', abv: 14.0 },
      { name: 'Twomey Chardonnay', vintage: '2022', varietal: 'Chardonnay', region: 'Russian River Valley', style: 'White', abv: 14.0 },
      { name: 'Twomey Pinot Noir Anderson Valley', vintage: '2021', varietal: 'Pinot Noir', region: 'Anderson Valley', style: 'Red', abv: 14.0 },
      { name: 'Twomey Pinot Noir Santa Barbara', vintage: '2021', varietal: 'Pinot Noir', region: 'Santa Barbara', style: 'Red', abv: 14.0 },
    ],
  },
  {
    name: 'Opus One',
    country: 'United States',
    website: 'https://www.opusonewinery.com',
    description: 'A joint venture between Robert Mondavi and Baron Philippe de Rothschild, producing one of Napa Valley\'s most prestigious wines.',
    products: [
      { name: 'Opus One', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Overture', vintage: 'NV', varietal: 'Bordeaux Blend', region: 'Napa Valley', style: 'Red', abv: 14.0 },
      { name: 'Overture Red', vintage: 'NV', varietal: 'Bordeaux Blend', region: 'Napa Valley', style: 'Red', abv: 14.0 },
    ],
  },
  {
    name: 'Caymus',
    country: 'United States',
    website: 'https://www.caymus.com',
    description: 'Caymus Vineyards produces rich, full-bodied Cabernet Sauvignon from Napa Valley.',
    products: [
      { name: 'Napa Valley Cabernet Sauvignon', vintage: '2021', varietal: 'Cabernet Sauvignon', region: 'Napa Valley', style: 'Red', abv: 14.9 },
      { name: 'Special Selection Cabernet Sauvignon', vintage: '2020', varietal: 'Cabernet Sauvignon', region: 'Napa Valley', style: 'Red', abv: 15.2 },
      { name: 'Conundrum White', vintage: '2022', varietal: 'White Blend', region: 'California', style: 'White', abv: 13.5 },
      { name: 'Conundrum Red', vintage: '2021', varietal: 'Red Blend', region: 'California', style: 'Red', abv: 14.5 },
      { name: 'Belle Glos Pinot Noir', vintage: '2022', varietal: 'Pinot Noir', region: 'Sonoma Coast', style: 'Red', abv: 14.5 },
      { name: 'Belle Glos Las Alturas', vintage: '2021', varietal: 'Pinot Noir', region: 'Santa Lucia Highlands', style: 'Red', abv: 14.5 },
      { name: 'Belle Glos Clark & Telephone', vintage: '2021', varietal: 'Pinot Noir', region: 'Santa Maria Valley', style: 'Red', abv: 14.5 },
      { name: 'Belle Glos Dairyman', vintage: '2021', varietal: 'Pinot Noir', region: 'Russian River Valley', style: 'Red', abv: 14.5 },
      { name: 'Belle Glos Eulenloch', vintage: '2021', varietal: 'Pinot Noir', region: 'Sonoma Coast', style: 'Red', abv: 14.5 },
      { name: 'Conundrum Sparkling', vintage: 'NV', varietal: 'Sparkling Blend', region: 'California', style: 'Sparkling', abv: 12.5 },
    ],
  },
  {
    name: 'Dom Pérignon',
    country: 'France',
    website: 'https://www.domperignon.com',
    description: 'The prestige cuvée of Moët & Chandon, one of the world\'s most celebrated Champagnes.',
    products: [
      { name: 'Dom Pérignon', vintage: '2014', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Dom Pérignon Rosé', vintage: '2012', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Dom Pérignon P2', vintage: '2004', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Dom Pérignon Vintage', vintage: '2013', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Dom Pérignon Plénitude 2', vintage: '2002', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
    ],
  },
  {
    name: 'Moët & Chandon',
    country: 'France',
    website: 'https://www.moet.com',
    description: 'One of the world\'s largest Champagne producers, founded in 1743.',
    products: [
      { name: 'Moët Impérial', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.0 },
      { name: 'Moët Rosé Impérial', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.0 },
      { name: 'Moët Ice Impérial', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.0 },
      { name: 'Moët Nectar Impérial', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', sweetness: 'Semi-Sweet', abv: 12.0 },
      { name: 'Moët Grand Vintage', vintage: '2015', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Moët Grand Vintage Rosé', vintage: '2013', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
    ],
  },
  {
    name: 'Veuve Clicquot',
    country: 'France',
    website: 'https://www.veuve-clicquot.com',
    description: 'Founded in 1772, Veuve Clicquot is known for its distinctive yellow label and high-quality Champagnes.',
    products: [
      { name: 'Yellow Label Brut', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.0 },
      { name: 'Rosé', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.0 },
      { name: 'La Grande Dame', vintage: '2012', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Rich', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', sweetness: 'Semi-Sweet', abv: 12.0 },
      { name: 'Demi-Sec', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', sweetness: 'Semi-Sweet', abv: 12.0 },
    ],
  },
  {
    name: 'Krug',
    country: 'France',
    website: 'https://www.krug.com',
    description: 'Prestigious Champagne house known for its complex, full-bodied Champagnes.',
    products: [
      { name: 'Grande Cuvée', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Vintage', vintage: '2013', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Rosé', vintage: 'NV', varietal: 'Champagne Blend', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Clos du Mesnil', vintage: '2008', varietal: 'Chardonnay', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
      { name: 'Clos d\'Ambonnay', vintage: '2004', varietal: 'Pinot Noir', region: 'Champagne', style: 'Sparkling', abv: 12.5 },
    ],
  },
  {
    name: 'Château Margaux',
    country: 'France',
    website: 'https://www.chateau-margaux.com',
    description: 'First Growth Bordeaux estate in the Médoc, producing some of the world\'s most prestigious wines.',
    products: [
      { name: 'Château Margaux', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Bordeaux', appellation: 'AOC Margaux', style: 'Red', abv: 13.5 },
      { name: 'Pavillon Rouge', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Bordeaux', appellation: 'AOC Margaux', style: 'Red', abv: 13.0 },
      { name: 'Pavillon Blanc', vintage: '2022', varietal: 'Sauvignon Blanc', region: 'Bordeaux', appellation: 'AOC Margaux', style: 'White', abv: 13.0 },
    ],
  },
  {
    name: 'Château Latour',
    country: 'France',
    website: 'https://www.chateau-latour.com',
    description: 'First Growth Bordeaux estate in Pauillac, known for powerful, long-lived wines.',
    products: [
      { name: 'Château Latour', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Bordeaux', appellation: 'AOC Pauillac', style: 'Red', abv: 13.5 },
      { name: 'Les Forts de Latour', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Bordeaux', appellation: 'AOC Pauillac', style: 'Red', abv: 13.0 },
      { name: 'Pauillac de Latour', vintage: '2021', varietal: 'Bordeaux Blend', region: 'Bordeaux', appellation: 'AOC Pauillac', style: 'Red', abv: 12.5 },
    ],
  },
  {
    name: 'Château Lafite Rothschild',
    country: 'France',
    website: 'https://www.lafite.com',
    description: 'First Growth Bordeaux estate in Pauillac, producing elegant, refined wines.',
    products: [
      { name: 'Château Lafite Rothschild', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Bordeaux', appellation: 'AOC Pauillac', style: 'Red', abv: 13.5 },
      { name: 'Carruades de Lafite', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Bordeaux', appellation: 'AOC Pauillac', style: 'Red', abv: 13.0 },
    ],
  },
  {
    name: 'Penfolds',
    country: 'Australia',
    website: 'https://www.penfolds.com',
    description: 'Iconic Australian winery known for Grange, one of Australia\'s most celebrated wines.',
    products: [
      { name: 'Grange', vintage: '2018', varietal: 'Shiraz', region: 'South Australia', style: 'Red', abv: 14.5 },
      { name: 'Bin 707 Cabernet Sauvignon', vintage: '2020', varietal: 'Cabernet Sauvignon', region: 'South Australia', style: 'Red', abv: 14.5 },
      { name: 'Bin 389 Cabernet Shiraz', vintage: '2020', varietal: 'Cabernet Shiraz', region: 'South Australia', style: 'Red', abv: 14.5 },
      { name: 'Bin 407 Cabernet Sauvignon', vintage: '2020', varietal: 'Cabernet Sauvignon', region: 'South Australia', style: 'Red', abv: 14.5 },
      { name: 'Bin 128 Shiraz', vintage: '2020', varietal: 'Shiraz', region: 'Coonawarra', style: 'Red', abv: 14.5 },
      { name: 'Bin 28 Shiraz', vintage: '2020', varietal: 'Shiraz', region: 'South Australia', style: 'Red', abv: 14.5 },
      { name: 'Yattarna Chardonnay', vintage: '2020', varietal: 'Chardonnay', region: 'South Australia', style: 'White', abv: 13.5 },
      { name: 'Bin 51 Riesling', vintage: '2022', varietal: 'Riesling', region: 'Eden Valley', style: 'White', abv: 12.5 },
      { name: 'Bin 311 Chardonnay', vintage: '2021', varietal: 'Chardonnay', region: 'Tumbarumba', style: 'White', abv: 13.0 },
      { name: 'Koonunga Hill', vintage: '2021', varietal: 'Shiraz Cabernet', region: 'South Australia', style: 'Red', abv: 14.0 },
    ],
  },
  {
    name: 'Cloudy Bay',
    country: 'New Zealand',
    website: 'https://www.cloudybay.com',
    description: 'Pioneering New Zealand winery known for exceptional Sauvignon Blanc from Marlborough.',
    products: [
      { name: 'Sauvignon Blanc', vintage: '2023', varietal: 'Sauvignon Blanc', region: 'Marlborough', style: 'White', abv: 13.5 },
      { name: 'Chardonnay', vintage: '2022', varietal: 'Chardonnay', region: 'Marlborough', style: 'White', abv: 13.5 },
      { name: 'Pinot Noir', vintage: '2022', varietal: 'Pinot Noir', region: 'Marlborough', style: 'Red', abv: 13.5 },
      { name: 'Te Koko', vintage: '2021', varietal: 'Sauvignon Blanc', region: 'Marlborough', style: 'White', abv: 13.5 },
      { name: 'Pelorus', vintage: 'NV', varietal: 'Champagne Blend', region: 'Marlborough', style: 'Sparkling', abv: 12.5 },
    ],
  },
  {
    name: 'Kim Crawford',
    country: 'New Zealand',
    website: 'https://www.kimcrawfordwines.com',
    description: 'Popular New Zealand wine brand known for vibrant Sauvignon Blanc.',
    products: [
      { name: 'Sauvignon Blanc', vintage: '2023', varietal: 'Sauvignon Blanc', region: 'Marlborough', style: 'White', abv: 13.0 },
      { name: 'Pinot Noir', vintage: '2022', varietal: 'Pinot Noir', region: 'Marlborough', style: 'Red', abv: 13.5 },
      { name: 'Chardonnay', vintage: '2022', varietal: 'Chardonnay', region: 'Marlborough', style: 'White', abv: 13.5 },
      { name: 'Pinot Gris', vintage: '2023', varietal: 'Pinot Gris', region: 'Marlborough', style: 'White', abv: 13.0 },
      { name: 'Riesling', vintage: '2023', varietal: 'Riesling', region: 'Marlborough', style: 'White', abv: 12.5 },
    ],
  },
  {
    name: 'Kendall-Jackson',
    country: 'United States',
    website: 'https://www.kj.com',
    description: 'Family-owned California winery known for Chardonnay and other varietals.',
    products: [
      { name: 'Vintner\'s Reserve Chardonnay', vintage: '2022', varietal: 'Chardonnay', region: 'California', style: 'White', abv: 13.5 },
      { name: 'Grand Reserve Chardonnay', vintage: '2021', varietal: 'Chardonnay', region: 'California', style: 'White', abv: 14.0 },
      { name: 'Vintner\'s Reserve Cabernet Sauvignon', vintage: '2020', varietal: 'Cabernet Sauvignon', region: 'California', style: 'Red', abv: 13.5 },
      { name: 'Vintner\'s Reserve Pinot Noir', vintage: '2021', varietal: 'Pinot Noir', region: 'California', style: 'Red', abv: 13.5 },
      { name: 'Vintner\'s Reserve Merlot', vintage: '2020', varietal: 'Merlot', region: 'California', style: 'Red', abv: 13.5 },
      { name: 'Avant Chardonnay', vintage: '2022', varietal: 'Chardonnay', region: 'California', style: 'White', abv: 13.5 },
      { name: 'Jackson Estate Chardonnay', vintage: '2021', varietal: 'Chardonnay', region: 'Sonoma County', style: 'White', abv: 14.0 },
    ],
  },
  {
    name: 'Meiomi',
    country: 'United States',
    website: 'https://www.meiomi.com',
    description: 'California wine brand known for rich, fruit-forward Pinot Noir.',
    products: [
      { name: 'Pinot Noir', vintage: '2022', varietal: 'Pinot Noir', region: 'California', style: 'Red', abv: 13.8 },
      { name: 'Chardonnay', vintage: '2022', varietal: 'Chardonnay', region: 'California', style: 'White', abv: 13.5 },
      { name: 'Rosé', vintage: '2023', varietal: 'Pinot Noir', region: 'California', style: 'Rosé', abv: 13.0 },
      { name: 'Cabernet Sauvignon', vintage: '2021', varietal: 'Cabernet Sauvignon', region: 'California', style: 'Red', abv: 14.5 },
    ],
  },
  {
    name: 'Justin',
    country: 'United States',
    website: 'https://www.justinwine.com',
    description: 'Paso Robles winery known for Bordeaux-style blends and Cabernet Sauvignon.',
    products: [
      { name: 'Isosceles', vintage: '2020', varietal: 'Bordeaux Blend', region: 'Paso Robles', style: 'Red', abv: 14.5 },
      { name: 'Justification', vintage: '2021', varietal: 'Cabernet Franc Merlot', region: 'Paso Robles', style: 'Red', abv: 14.5 },
      { name: 'Savant', vintage: '2020', varietal: 'Syrah Grenache', region: 'Paso Robles', style: 'Red', abv: 14.5 },
      { name: 'Right Angle', vintage: '2021', varietal: 'Red Blend', region: 'Paso Robles', style: 'Red', abv: 14.0 },
      { name: 'Cabernet Sauvignon', vintage: '2021', varietal: 'Cabernet Sauvignon', region: 'Paso Robles', style: 'Red', abv: 14.5 },
    ],
  },
  {
    name: 'Rombauer',
    country: 'United States',
    website: 'https://www.rombauer.com',
    description: 'Napa Valley winery famous for its rich, buttery Chardonnay.',
    products: [
      { name: 'Chardonnay', vintage: '2022', varietal: 'Chardonnay', region: 'Carneros', style: 'White', abv: 14.5 },
      { name: 'Cabernet Sauvignon', vintage: '2020', varietal: 'Cabernet Sauvignon', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Zinfandel', vintage: '2021', varietal: 'Zinfandel', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Merlot', vintage: '2020', varietal: 'Merlot', region: 'Napa Valley', style: 'Red', abv: 14.5 },
      { name: 'Sauvignon Blanc', vintage: '2023', varietal: 'Sauvignon Blanc', region: 'Napa Valley', style: 'White', abv: 13.5 },
    ],
  },
]

// Real whiskey brands with their actual top products
const whiskeyBrandsData = [
  {
    name: 'Johnnie Walker',
    country: 'Scotland',
    website: 'https://www.johnniewalker.com',
    description: 'World\'s best-selling Scotch whisky brand, known for its blended whiskies.',
    products: [
      { name: 'Red Label', ageStatement: 'NAS', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: 'Black Label', ageStatement: '12 years', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: 'Double Black', ageStatement: 'NAS', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: 'Green Label', ageStatement: '15 years', style: 'Blended Malt', region: 'Scotland', abv: 43.0, proof: 86 },
      { name: 'Gold Label Reserve', ageStatement: 'NAS', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: 'Platinum Label', ageStatement: '18 years', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: 'Blue Label', ageStatement: 'NAS', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: 'Swing', ageStatement: 'NAS', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: '18 Year Old', ageStatement: '18 years', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
      { name: 'Blenders\' Batch Series', ageStatement: 'NAS', style: 'Blended', region: 'Scotland', abv: 40.0, proof: 80 },
    ],
  },
  {
    name: 'Jack Daniel\'s',
    country: 'United States',
    website: 'https://www.jackdaniels.com',
    description: 'Tennessee whiskey brand, one of the best-selling American whiskeys worldwide.',
    products: [
      { name: 'Old No. 7', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 40.0, proof: 80 },
      { name: 'Single Barrel Select', ageStatement: 'NAS', style: 'Single Barrel', region: 'Tennessee', abv: 47.0, proof: 94 },
      { name: 'Gentleman Jack', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 40.0, proof: 80 },
      { name: 'Tennessee Honey', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 35.0, proof: 70 },
      { name: 'Tennessee Fire', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 35.0, proof: 70 },
      { name: 'Tennessee Rye', ageStatement: 'NAS', style: 'Rye', region: 'Tennessee', abv: 45.0, proof: 90 },
      { name: 'Sinatra Select', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 45.0, proof: 90 },
      { name: 'Gold No. 27', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 40.0, proof: 80 },
      { name: 'Master Distiller Series', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 43.0, proof: 86 },
      { name: 'Tennessee Apple', ageStatement: 'NAS', style: 'Tennessee Whiskey', region: 'Tennessee', abv: 35.0, proof: 70 },
    ],
  },
  {
    name: 'Jim Beam',
    country: 'United States',
    website: 'https://www.jimbeam.com',
    description: 'World\'s best-selling bourbon brand, established in 1795.',
    products: [
      { name: 'White Label', ageStatement: '4 years', style: 'Bourbon', region: 'Kentucky', abv: 40.0, proof: 80, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Black Label', ageStatement: '6 years', style: 'Bourbon', region: 'Kentucky', abv: 43.0, proof: 86, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Double Oak', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 43.0, proof: 86, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Devil\'s Cut', ageStatement: '6 years', style: 'Bourbon', region: 'Kentucky', abv: 45.0, proof: 90, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Rye', ageStatement: '4 years', style: 'Rye', region: 'Kentucky', abv: 40.0, proof: 80, mashBill: '51% rye, 37% corn, 12% malted barley' },
      { name: 'Single Barrel', ageStatement: 'NAS', style: 'Single Barrel', region: 'Kentucky', abv: 47.5, proof: 95, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Bonded', ageStatement: '4 years', style: 'Bottled in Bond', region: 'Kentucky', abv: 50.0, proof: 100, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Repeal Batch', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 43.0, proof: 86, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Signature Craft', ageStatement: '12 years', style: 'Bourbon', region: 'Kentucky', abv: 43.0, proof: 86, mashBill: '75% corn, 13% rye, 12% malted barley' },
      { name: 'Kentucky Straight Bourbon', ageStatement: '4 years', style: 'Bourbon', region: 'Kentucky', abv: 40.0, proof: 80, mashBill: '75% corn, 13% rye, 12% malted barley' },
    ],
  },
  {
    name: 'Macallan',
    country: 'Scotland',
    website: 'https://www.themacallan.com',
    description: 'Premium single malt Scotch whisky from Speyside, known for sherry cask maturation.',
    products: [
      { name: '12 Year Sherry Oak', ageStatement: '12 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80, caskType: 'Sherry Cask' },
      { name: '12 Year Double Cask', ageStatement: '12 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80, caskType: 'Sherry Cask' },
      { name: '15 Year Double Cask', ageStatement: '15 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
      { name: '18 Year Sherry Oak', ageStatement: '18 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
      { name: '18 Year Double Cask', ageStatement: '18 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
      { name: '25 Year', ageStatement: '25 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
      { name: 'Rare Cask', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
      { name: 'Fine Oak', ageStatement: '12 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80, caskType: 'Bourbon Barrel' },
      { name: 'Triple Cask Matured', ageStatement: '15 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
      { name: 'Estate', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
    ],
  },
  {
    name: 'Glenfiddich',
    country: 'Scotland',
    website: 'https://www.glenfiddich.com',
    description: 'World\'s most awarded single malt Scotch whisky, family-owned since 1887.',
    products: [
      { name: '12 Year Old', ageStatement: '12 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: '15 Year Old', ageStatement: '15 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: '18 Year Old', ageStatement: '18 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: '21 Year Old', ageStatement: '21 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: 'Project XX', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 47.0, proof: 94 },
      { name: 'Fire & Cane', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, finish: 'Peated' },
      { name: 'IPA Experiment', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86 },
      { name: 'Winter Storm', ageStatement: '21 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86 },
      { name: 'Experimental Series', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 47.0, proof: 94 },
      { name: 'Reserve Cask', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
    ],
  },
  {
    name: 'Glenlivet',
    country: 'Scotland',
    website: 'https://www.theglenlivet.com',
    description: 'Speyside single malt Scotch whisky, one of the most popular globally.',
    products: [
      { name: '12 Year Old', ageStatement: '12 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: '15 Year Old', ageStatement: '15 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: '18 Year Old', ageStatement: '18 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86 },
      { name: '21 Year Old', ageStatement: '21 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86 },
      { name: 'Founder\'s Reserve', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: 'Nadurra', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 48.0, proof: 96 },
      { name: 'Code', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: 'Alpha', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 50.0, proof: 100 },
      { name: 'XXV', ageStatement: '25 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86 },
      { name: 'Encore', ageStatement: '21 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86 },
    ],
  },
  {
    name: 'Buffalo Trace',
    country: 'United States',
    website: 'https://www.buffalotrace.com',
    description: 'Historic Kentucky distillery producing award-winning bourbon.',
    products: [
      { name: 'Buffalo Trace', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 40.0, proof: 80, mashBill: 'low rye' },
      { name: 'Eagle Rare', ageStatement: '10 years', style: 'Bourbon', region: 'Kentucky', abv: 45.0, proof: 90, mashBill: 'low rye' },
      { name: 'Blanton\'s Single Barrel', ageStatement: 'NAS', style: 'Single Barrel', region: 'Kentucky', abv: 46.5, proof: 93, mashBill: 'low rye' },
      { name: 'Weller Special Reserve', ageStatement: 'NAS', style: 'Wheated', region: 'Kentucky', abv: 45.0, proof: 90, mashBill: 'wheated' },
      { name: 'Weller Antique 107', ageStatement: 'NAS', style: 'Wheated', region: 'Kentucky', abv: 53.5, proof: 107, mashBill: 'wheated' },
      { name: 'Weller 12 Year', ageStatement: '12 years', style: 'Wheated', region: 'Kentucky', abv: 45.0, proof: 90, mashBill: 'wheated' },
      { name: 'Stagg Jr.', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 65.0, proof: 130, mashBill: 'low rye' },
      { name: 'George T. Stagg', ageStatement: '15+ years', style: 'Bourbon', region: 'Kentucky', abv: 65.0, proof: 130, mashBill: 'low rye' },
      { name: 'Pappy Van Winkle 15 Year', ageStatement: '15 years', style: 'Wheated', region: 'Kentucky', abv: 53.5, proof: 107, mashBill: 'wheated' },
      { name: 'Pappy Van Winkle 20 Year', ageStatement: '20 years', style: 'Wheated', region: 'Kentucky', abv: 45.2, proof: 90.4, mashBill: 'wheated' },
    ],
  },
  {
    name: 'Maker\'s Mark',
    country: 'United States',
    website: 'https://www.makersmark.com',
    description: 'Kentucky bourbon known for its red wax seal and wheated mash bill.',
    products: [
      { name: 'Maker\'s Mark', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 45.0, proof: 90, mashBill: 'wheated' },
      { name: 'Maker\'s Mark 46', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 47.0, proof: 94, mashBill: 'wheated' },
      { name: 'Cask Strength', ageStatement: 'NAS', style: 'Cask Strength', region: 'Kentucky', abv: 56.0, proof: 112, mashBill: 'wheated' },
      { name: 'Private Select', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 55.0, proof: 110, mashBill: 'wheated' },
      { name: '101', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 50.5, proof: 101, mashBill: 'wheated' },
    ],
  },
  {
    name: 'Woodford Reserve',
    country: 'United States',
    website: 'https://www.woodfordreserve.com',
    description: 'Premium Kentucky bourbon from the historic Labrot & Graham distillery.',
    products: [
      { name: 'Distiller\'s Select', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 45.2, proof: 90.4, mashBill: 'high rye' },
      { name: 'Double Oaked', ageStatement: 'NAS', style: 'Bourbon', region: 'Kentucky', abv: 45.2, proof: 90.4, mashBill: 'high rye' },
      { name: 'Rye', ageStatement: 'NAS', style: 'Rye', region: 'Kentucky', abv: 45.2, proof: 90.4, mashBill: '53% rye' },
      { name: 'Malt', ageStatement: 'NAS', style: 'Malt Whiskey', region: 'Kentucky', abv: 45.2, proof: 90.4 },
      { name: 'Wheat', ageStatement: 'NAS', style: 'Wheated', region: 'Kentucky', abv: 45.2, proof: 90.4, mashBill: 'wheated' },
    ],
  },
  {
    name: 'Yamazaki',
    country: 'Japan',
    website: 'https://www.suntory.com',
    description: 'Japan\'s first single malt whisky distillery, producing elegant and complex whiskies.',
    products: [
      { name: '12 Year Old', ageStatement: '12 years', style: 'Single Malt', region: 'Japan', abv: 43.0, proof: 86 },
      { name: '18 Year Old', ageStatement: '18 years', style: 'Single Malt', region: 'Japan', abv: 43.0, proof: 86 },
      { name: '25 Year Old', ageStatement: '25 years', style: 'Single Malt', region: 'Japan', abv: 43.0, proof: 86 },
      { name: 'Distiller\'s Reserve', ageStatement: 'NAS', style: 'Single Malt', region: 'Japan', abv: 43.0, proof: 86 },
      { name: 'Single Malt', ageStatement: 'NAS', style: 'Single Malt', region: 'Japan', abv: 43.0, proof: 86 },
    ],
  },
  {
    name: 'Hibiki',
    country: 'Japan',
    website: 'https://www.suntory.com',
    description: 'Premium blended Japanese whisky from Suntory.',
    products: [
      { name: 'Japanese Harmony', ageStatement: 'NAS', style: 'Blended', region: 'Japan', abv: 43.0, proof: 86 },
      { name: '17 Year Old', ageStatement: '17 years', style: 'Blended', region: 'Japan', abv: 43.0, proof: 86 },
      { name: '21 Year Old', ageStatement: '21 years', style: 'Blended', region: 'Japan', abv: 43.0, proof: 86 },
      { name: 'Blender\'s Choice', ageStatement: 'NAS', style: 'Blended', region: 'Japan', abv: 43.0, proof: 86 },
      { name: 'Master\'s Select', ageStatement: 'NAS', style: 'Blended', region: 'Japan', abv: 43.0, proof: 86 },
    ],
  },
  {
    name: 'Jameson',
    country: 'Ireland',
    website: 'https://www.jamesonwhiskey.com',
    description: 'World\'s best-selling Irish whiskey, triple-distilled for smoothness.',
    products: [
      { name: 'Jameson Original', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Black Barrel', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Caskmates IPA', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Caskmates Stout', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: '18 Year Old', ageStatement: '18 years', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Crested', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Cooper\'s Croze', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Distiller\'s Safe', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Blender\'s Dog', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
      { name: 'Bow Street', ageStatement: 'NAS', style: 'Irish Whiskey', region: 'Ireland', abv: 40.0, proof: 80 },
    ],
  },
  {
    name: 'Crown Royal',
    country: 'Canada',
    website: 'https://www.crownroyal.com',
    description: 'Premium Canadian whisky brand, known for its distinctive purple bag.',
    products: [
      { name: 'Deluxe', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 40.0, proof: 80 },
      { name: 'Black', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 40.0, proof: 80 },
      { name: 'Reserve', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 40.0, proof: 80 },
      { name: 'XR', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 40.0, proof: 80 },
      { name: 'Northern Harvest Rye', ageStatement: 'NAS', style: 'Rye', region: 'Canada', abv: 45.0, proof: 90 },
      { name: 'Regal Apple', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 35.0, proof: 70 },
      { name: 'Vanilla', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 35.0, proof: 70 },
      { name: 'Peach', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 35.0, proof: 70 },
      { name: 'Salted Caramel', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 35.0, proof: 70 },
      { name: 'Maple Finished', ageStatement: 'NAS', style: 'Canadian Whisky', region: 'Canada', abv: 40.0, proof: 80 },
    ],
  },
  {
    name: 'Ardbeg',
    country: 'Scotland',
    website: 'https://www.ardbeg.com',
    description: 'Islay single malt Scotch whisky known for its heavily peated character.',
    products: [
      { name: '10 Year Old', ageStatement: '10 years', style: 'Single Malt', region: 'Islay', abv: 46.0, proof: 92, finish: 'Peated' },
      { name: 'Uigeadail', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 54.2, proof: 108.4, finish: 'Peated', caskType: 'Sherry Cask' },
      { name: 'Corryvreckan', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 57.1, proof: 114.2, finish: 'Peated' },
      { name: 'An Oa', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 46.6, proof: 93.2, finish: 'Peated' },
      { name: 'Blaaack', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 46.0, proof: 92, finish: 'Peated', caskType: 'Pinot Noir Cask' },
      { name: 'Traigh Bhan', ageStatement: '19 years', style: 'Single Malt', region: 'Islay', abv: 46.2, proof: 92.4, finish: 'Peated' },
      { name: 'Scorch', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 46.0, proof: 92, finish: 'Peated' },
      { name: 'Fermutation', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 50.0, proof: 100, finish: 'Peated' },
      { name: 'Ardcore', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 46.0, proof: 92, finish: 'Peated' },
      { name: 'Wee Beastie', ageStatement: '5 years', style: 'Single Malt', region: 'Islay', abv: 47.4, proof: 94.8, finish: 'Peated' },
    ],
  },
  {
    name: 'Lagavulin',
    country: 'Scotland',
    website: 'https://www.malts.com',
    description: 'Islay single malt Scotch whisky known for its rich, smoky character.',
    products: [
      { name: '8 Year Old', ageStatement: '8 years', style: 'Single Malt', region: 'Islay', abv: 48.0, proof: 96, finish: 'Peated' },
      { name: '16 Year Old', ageStatement: '16 years', style: 'Single Malt', region: 'Islay', abv: 43.0, proof: 86, finish: 'Peated' },
      { name: 'Distillers Edition', ageStatement: '16 years', style: 'Single Malt', region: 'Islay', abv: 43.0, proof: 86, finish: 'Peated', caskType: 'Pedro Ximénez Cask' },
      { name: '12 Year Old', ageStatement: '12 years', style: 'Single Malt', region: 'Islay', abv: 56.5, proof: 113, finish: 'Peated' },
      { name: 'Offerman Edition', ageStatement: '11 years', style: 'Single Malt', region: 'Islay', abv: 46.0, proof: 92, finish: 'Peated' },
    ],
  },
  {
    name: 'Laphroaig',
    country: 'Scotland',
    website: 'https://www.laphroaig.com',
    description: 'Islay single malt Scotch whisky with a distinctive medicinal, peaty character.',
    products: [
      { name: '10 Year Old', ageStatement: '10 years', style: 'Single Malt', region: 'Islay', abv: 40.0, proof: 80, finish: 'Peated' },
      { name: 'Quarter Cask', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 48.0, proof: 96, finish: 'Peated' },
      { name: 'Triple Wood', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 48.0, proof: 96, finish: 'Peated' },
      { name: 'Lore', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 48.0, proof: 96, finish: 'Peated' },
      { name: 'Select', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 40.0, proof: 80, finish: 'Peated' },
      { name: 'Cask Strength', ageStatement: '10 years', style: 'Single Malt', region: 'Islay', abv: 58.0, proof: 116, finish: 'Peated' },
      { name: '18 Year Old', ageStatement: '18 years', style: 'Single Malt', region: 'Islay', abv: 48.0, proof: 96, finish: 'Peated' },
      { name: 'PX Cask', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 48.0, proof: 96, finish: 'Peated', caskType: 'Pedro Ximénez Cask' },
      { name: 'Cairdeas', ageStatement: 'NAS', style: 'Single Malt', region: 'Islay', abv: 51.5, proof: 103, finish: 'Peated' },
      { name: '25 Year Old', ageStatement: '25 years', style: 'Single Malt', region: 'Islay', abv: 45.1, proof: 90.2, finish: 'Peated' },
    ],
  },
  {
    name: 'Balvenie',
    country: 'Scotland',
    website: 'https://www.thebalvenie.com',
    description: 'Speyside single malt Scotch whisky known for its honeyed, complex character.',
    products: [
      { name: 'DoubleWood 12 Year', ageStatement: '12 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80, caskType: 'Sherry Cask' },
      { name: 'Caribbean Cask 14 Year', ageStatement: '14 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Rum Cask' },
      { name: 'DoubleWood 17 Year', ageStatement: '17 years', style: 'Single Malt', region: 'Speyside', abv: 43.0, proof: 86, caskType: 'Sherry Cask' },
      { name: 'PortWood 21 Year', ageStatement: '21 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80, caskType: 'Port Cask' },
      { name: 'Tun 1509', ageStatement: 'NAS', style: 'Single Malt', region: 'Speyside', abv: 47.1, proof: 94.2 },
      { name: 'Peat Week', ageStatement: '14 years', style: 'Single Malt', region: 'Speyside', abv: 48.3, proof: 96.6, finish: 'Peated' },
      { name: 'Single Barrel', ageStatement: '12 years', style: 'Single Barrel', region: 'Speyside', abv: 47.8, proof: 95.6 },
      { name: 'Triple Cask', ageStatement: '12 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80 },
      { name: 'Madeira Cask', ageStatement: '21 years', style: 'Single Malt', region: 'Speyside', abv: 40.0, proof: 80, caskType: 'Madeira Cask' },
      { name: 'Week of Peat', ageStatement: '14 years', style: 'Single Malt', region: 'Speyside', abv: 48.3, proof: 96.6, finish: 'Peated' },
    ],
  },
]

async function main() {
  console.log('Starting seed with real data...')

  // Create wine brands and products
  console.log(`Processing ${wineBrandsData.length} wine brands...`)
  for (let i = 0; i < wineBrandsData.length; i++) {
    const brandData = wineBrandsData[i]
    
    // Check if brand already exists
    let brand = await prisma.brand.findFirst({
      where: {
        name: brandData.name,
        type: 'WINE',
      },
    })

    if (!brand) {
      // Create brand if it doesn't exist
      brand = await prisma.brand.create({
        data: {
          name: brandData.name,
          type: 'WINE',
          country: brandData.country,
          website: brandData.website,
          description: brandData.description,
        },
      })
      console.log(`Created brand: ${brandData.name}`)
    } else {
      console.log(`Brand already exists, skipping: ${brandData.name}`)
    }

    // Create products only if they don't already exist
    for (const productData of brandData.products) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: productData.name,
          brandId: brand.id,
        },
      })

      if (!existingProduct) {
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            brandId: brand.id,
            description: `${productData.name} from ${brandData.name}, a ${productData.style.toLowerCase()} wine from ${productData.region}.`,
          },
        })

        await prisma.wineProduct.create({
          data: {
            productId: product.id,
            vintage: productData.vintage,
            varietal: productData.varietal,
            region: productData.region,
            appellation: ('appellation' in productData ? productData.appellation : null) || null,
            style: productData.style,
            sweetness: ('sweetness' in productData ? productData.sweetness : null) || null,
            abv: productData.abv,
            producer: ('producer' in productData ? productData.producer : null) || null,
            vineyard: ('vineyard' in productData ? productData.vineyard : null) || null,
          },
        })
      }
    }

    if ((i + 1) % 5 === 0) {
      console.log(`Processed ${i + 1} wine brands...`)
    }
  }

  // Create whiskey brands and products
  console.log(`Processing ${whiskeyBrandsData.length} whiskey brands...`)
  for (let i = 0; i < whiskeyBrandsData.length; i++) {
    const brandData = whiskeyBrandsData[i]
    
    // Check if brand already exists
    let brand = await prisma.brand.findFirst({
      where: {
        name: brandData.name,
        type: 'SPIRIT',
      },
    })

    if (!brand) {
      // Create brand if it doesn't exist
      brand = await prisma.brand.create({
        data: {
          name: brandData.name,
          type: 'SPIRIT',
          country: brandData.country,
          website: brandData.website,
          description: brandData.description,
        },
      })
      console.log(`Created brand: ${brandData.name}`)
    } else {
      console.log(`Brand already exists, skipping: ${brandData.name}`)
    }

    // Create products only if they don't already exist
    for (const productData of brandData.products) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: productData.name,
          brandId: brand.id,
        },
      })

      if (!existingProduct) {
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            brandId: brand.id,
            description: `${productData.name} from ${brandData.name}, a ${productData.style.toLowerCase()} from ${productData.region}.`,
          },
        })

        await prisma.spiritProduct.create({
          data: {
            productId: product.id,
            ageStatement: productData.ageStatement,
            distillery: ('distillery' in productData ? productData.distillery : null) || null,
            caskType: ('caskType' in productData ? productData.caskType : null) || null,
            mashBill: ('mashBill' in productData ? productData.mashBill : null) || null,
            proof: productData.proof,
            abv: productData.abv,
            region: productData.region,
            style: productData.style,
            finish: ('finish' in productData ? productData.finish : null) || null,
            batchNumber: ('batchNumber' in productData ? productData.batchNumber : null) || null,
            releaseYear: ('releaseYear' in productData ? productData.releaseYear : null) || null,
            barrelNumber: ('barrelNumber' in productData ? productData.barrelNumber : null) || null,
          },
        })
      }
    }

    if ((i + 1) % 5 === 0) {
      console.log(`Processed ${i + 1} whiskey brands...`)
    }
  }

  const totalWineProducts = wineBrandsData.reduce((sum, brand) => sum + brand.products.length, 0)
  const totalWhiskeyProducts = whiskeyBrandsData.reduce((sum, brand) => sum + brand.products.length, 0)

  console.log('Seed completed successfully!')
  console.log(`Created ${wineBrandsData.length} wine brands with ${totalWineProducts} products`)
  console.log(`Created ${whiskeyBrandsData.length} whiskey brands with ${totalWhiskeyProducts} products`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

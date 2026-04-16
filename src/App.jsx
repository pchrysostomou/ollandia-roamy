import React, { useState, useEffect } from 'react';
import { places as initialPlaces, categories as availableVibes } from './data/netherlands';
import { MapPin, Star, Plus, Minus, Compass, ArrowRight, Link as LinkIcon, Sparkles, PlusCircle, Trash2, X, ChevronLeft, Map as MapIcon, ImageIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

const BrandIcon = L.divIcon({
  className: 'custom-pin-brand',
  html: `<div style="background-color: #FF6B00; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.6);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11]
});

function createCustomPin(color, dayNum) {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.6); flex-direction: column;">
            <span>${dayNum}</span>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
}

const DAY_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
// Ensure you change this to your production backend URL once deployed.
const BACKEND_URL = 'https://ollandia-roamy.onrender.com';

function MapBoundsFormatter({ places }) {
  const map = useMap();
  useEffect(() => {
    if (places && places.length > 0) {
      const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [places, map]);
  return null;
}

export default function App() {
  const [places, setPlaces] = useState(() => {
    const saved = localStorage.getItem('roamy_places');
    return saved ? JSON.parse(saved) : initialPlaces;
  });

  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem('roamy_lists');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'My Trip', items: [] }];
  });
  const [activeListId, setActiveListId] = useState(() => localStorage.getItem('roamy_activeListId') || 'default');
  const [smartItineraries, setSmartItineraries] = useState(() => {
    const saved = localStorage.getItem('roamy_smartItineraries');
    return saved ? JSON.parse(saved) : {}; 
  });

  // WIZARD STATES
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  // Other UI States
  const [newListName, setNewListName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [tripDurationDays, setTripDurationDays] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { localStorage.setItem('roamy_places', JSON.stringify(places)); }, [places]);
  useEffect(() => { localStorage.setItem('roamy_lists', JSON.stringify(lists)); }, [lists]);
  useEffect(() => { localStorage.setItem('roamy_activeListId', activeListId); }, [activeListId]);
  useEffect(() => { localStorage.setItem('roamy_smartItineraries', JSON.stringify(smartItineraries)); }, [smartItineraries]);

  const activeList = lists.find(l => l.id === activeListId);
  const currentItinerary = smartItineraries[activeListId];

  // Wizard Logics
  const toggleVibe = (vibe) => {
    if (selectedVibes.includes(vibe)) setSelectedVibes(selectedVibes.filter(v => v !== vibe));
    else setSelectedVibes([...selectedVibes, vibe]);
  };

  const getRecommendedCities = () => {
    const cityMap = {};
    places.forEach(p => {
      if(!cityMap[p.city]) cityMap[p.city] = { name: p.city, score: 0, image: `https://placehold.co/600x400/11141B/FF6B00?text=${encodeURIComponent(p.city)}`, placeCount: 0 };
      cityMap[p.city].placeCount++;
      if (selectedVibes.includes(p.category)) cityMap[p.city].score += 10;
    });

    const citiesArray = Object.values(cityMap);
    citiesArray.forEach(c => {
      if (c.name === 'Amsterdam') c.score -= 1000; 
    });

    return citiesArray.sort((a,b) => b.score - a.score);
  };

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    setWizardStep(3);
  };

  // Actions
  const handleCreateList = (e) => {
    e.preventDefault();
    if(newListName.trim() === '') return;
    const newList = { id: Date.now().toString(), name: newListName.trim(), items: [] };
    setLists([...lists, newList]);
    setActiveListId(newList.id);
    setNewListName('');
  };

  const addToList = (place) => {
    setLists(lists.map(list => {
      if (list.id === activeListId && !list.items.find(item => item.id === place.id)) {
        return { ...list, items: [...list.items, place] };
      }
      return list;
    }));
    const updatedIts = { ...smartItineraries };
    delete updatedIts[activeListId];
    setSmartItineraries(updatedIts);
  };

  const removeFromList = (id) => {
    setLists(lists.map(list => {
      if (list.id === activeListId) {
        return { ...list, items: list.items.filter(item => item.id !== id) };
      }
      return list;
    }));
    const updatedIts = { ...smartItineraries };
    delete updatedIts[activeListId];
    setSmartItineraries(updatedIts);
  };

  const handleLinkImport = async (e) => {
    e.preventDefault();
    if (!linkInput) return;
    setIsImporting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/scrape`, { url: linkInput });
      const newPlace = response.data;
      setPlaces([newPlace, ...places]);
      setLinkInput('');
      addToList(newPlace);
    } catch (err) {
      alert("Failed to reach backend Server.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateItinerary = async () => {
    setIsDurationModalOpen(false);
    setIsGenerating(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/itinerary`, { 
        places: activeList.items,
        duration: tripDurationDays 
      });
      const result = await response.data;
      setSmartItineraries({ ...smartItineraries, [activeListId]: result });
    } catch (err) {
      alert("Failed to generate AI Itinerary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getMarkerIcon = (placeId) => {
    if (!currentItinerary) return BrandIcon; 
    let assignedDayNum = null;
    currentItinerary.forEach(dayBlock => {
      if (dayBlock.placeIds.includes(placeId)) {
        assignedDayNum = dayBlock.day;
      }
    });
    if (assignedDayNum !== null) {
      const color = DAY_COLORS[(assignedDayNum - 1) % DAY_COLORS.length];
      return createCustomPin(color, assignedDayNum);
    }
    return BrandIcon;
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <Compass size={28} color="#FF6B00" />
            The Netherlands<span>Diaries</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {wizardStep > 1 && (
              <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>
                <ChevronLeft size={16} /> Home
              </button>
            )}
            
            <button className="btn btn-secondary" onClick={() => { localStorage.clear(); window.location.reload(); }}>Reset Data</button>
            
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero" style={{ height: wizardStep === 3 ? '300px' : '500px', transition: 'height 0.4s ease' }}>
        <img src="/hero_amsterdam_canal_1776289628576.png" alt="Amsterdam Canal" className="hero-img" />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>{wizardStep === 3 ? `Discover ${selectedCity}` : "Design the Perfect Trip"}</h1>
          <p>
            {wizardStep === 3 ? "Add places to your itinerary to let AI build your schedule." : "Avoid the crowds. Find your vibe. Let AI build the ultimate Netherlands itinerary."}
          </p>
          {wizardStep === 3 && (
            <form className="link-import-form" onSubmit={handleLinkImport} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
              <input 
                type="text" 
                placeholder="Paste Instagram or Website URL here..." 
                style={{ 
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', outline: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.95)', color: '#111'
                }}
                value={linkInput} onChange={e => setLinkInput(e.target.value)}
              />
              <button className="btn" type="submit" disabled={isImporting} style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <LinkIcon size={18} /> {isImporting ? "Scraping..." : "Import Web"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="main-wrapper">
        <div className="explore-section">

          {/* WIZARD STEP 1: Vibe Check */}
          {wizardStep === 1 && (
            <div style={{ animation: 'fade-in 0.5s ease-out' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Step 1: Choose Your Vibe</h2>
              <p style={{ color: '#9CA3AF', marginBottom: '2rem', fontSize: '1.1rem' }}>Select what you want to experience to discover hidden gems away from the tourist traps.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                {availableVibes.map(v => (
                  <div 
                    key={v}
                    onClick={() => toggleVibe(v)}
                    style={{
                      background: selectedVibes.includes(v) ? 'rgba(255, 107, 0, 0.2)' : 'var(--card-bg)',
                      border: `1px solid ${selectedVibes.includes(v) ? '#FF6B00' : 'var(--card-border)'}`,
                      padding: '2rem 1rem', borderRadius: '16px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.2s', transform: selectedVibes.includes(v) ? 'scale(1.02)' : 'none'
                    }}
                  >
                    <h3 style={{ fontSize: '1.3rem', color: selectedVibes.includes(v) ? '#FF6B00' : 'white' }}>{v}</h3>
                  </div>
                ))}
              </div>
              
              <button 
                className="btn" 
                style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
                onClick={() => setWizardStep(2)}
                disabled={selectedVibes.length === 0}
              >
                Find Recommended Cities <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* WIZARD STEP 2: Recommended Cities */}
          {wizardStep === 2 && (
            <div style={{ animation: 'fade-in 0.5s ease-out' }}>
              <button onClick={() => setWizardStep(1)} style={{ background: 'none', border:'none', color:'#FF6B00', cursor: 'pointer', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.25rem' }}><ChevronLeft size={16}/> Back to vibes</button>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Step 2: Recommended For You</h2>
              <p style={{ color: '#9CA3AF', marginBottom: '2rem', fontSize: '1.1rem' }}>Based on your vibes, these areas offer the best experiences.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {getRecommendedCities().map((city, idx) => (
                  <div 
                    key={city.name} className="card" onClick={() => handleCitySelect(city.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-img-wrapper">
                      <div className="card-category" style={{ background: '#10B981', color: 'white' }}>
                        {idx === 0 ? "Top Pick" : "Great Choice"}
                      </div>
                      <img src={city.image} alt={city.name} className="card-img" />
                    </div>
                    <div className="card-content">
                       <h3 className="card-title" style={{ fontSize: '1.4rem' }}>{city.name}</h3>
                       <p className="card-desc" style={{ marginBottom: 0 }}>{city.placeCount} places to explore</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WIZARD STEP 3: Deep Dive Explore */}
          {wizardStep === 3 && (
            <div style={{ animation: 'fade-in 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '2rem' }}>Places in {selectedCity}</h2>
                <button onClick={() => setWizardStep(2)} className="btn btn-secondary">
                  <MapIcon size={16}/> Change City
                </button>
              </div>

              {/* Map */}
              <div style={{ height: '350px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <MapContainer center={[52.20, 5.2]} zoom={7} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <MapBoundsFormatter places={places.filter(p => p.city === selectedCity)} />
                  {places.filter(p => p.city === selectedCity).map(place => (
                    <Marker key={place.id} position={[place.lat, place.lng]} icon={getMarkerIcon(place.id)}>
                      <Popup><strong>{place.name}</strong><br/>{place.city}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              
              <div className="cards-grid">
                {places.filter(p => p.city === selectedCity).map(place => (
                  <div className="card" key={place.id}>
                    <div className="card-img-wrapper">
                      <div className="card-category">{place.category}</div>
                      <img src={place.image} alt={place.name} className="card-img" />
                    </div>
                    <div className="card-content">
                      <h3 className="card-title">{place.name}</h3>
                      <p className="card-desc">{place.description}</p>
                      <div className="card-footer">
                        <div className="rating">
                          <Star size={16} fill="#FBBF24" /> {place.rating}
                        </div>
                        {activeList?.items.find(item => item.id === place.id) ? (
                          <button className="add-btn" style={{ background: '#FF6B00', color: 'white' }} onClick={() => removeFromList(place.id)}>
                            <Minus size={20} />
                          </button>
                        ) : (
                          <button className="add-btn" title="Add to current list" onClick={() => addToList(place)}>
                            <Plus size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        {wizardStep === 3 && (
          <aside className="sidebar" style={{ animation: 'fade-in 0.5s ease-out' }}>
            <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <h2 className="sidebar-title">My Travel Lists</h2>
                <p className="sidebar-desc">Organized places & plans</p>
              </div>
              <select 
                value={activeListId} onChange={(e) => setActiveListId(e.target.value)}
                style={{ padding: '0.5rem', background: '#222', color: 'white', borderRadius: '8px', border: '1px solid #444' }}
              >
                {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              
            </div>

            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem' }}>{activeList?.name} ({activeList?.items.length})</h3>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn" onClick={() => setIsDurationModalOpen(true)} disabled={!activeList || activeList.items.length === 0 || isGenerating} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: currentItinerary ? '#10B981' : '#222', border: '1px solid #444' }}>
                  {isGenerating ? "Processing..." : currentItinerary ? <><Sparkles size={14}/> Saved AI Plan</> : <><Sparkles size={14}/> AI Itinerary</>}
                </button>
              </div>
            </div>

            <div className="itinerary-list">
              {!activeList || (activeList.items.length === 0 && !currentItinerary) ? (
                <div className="empty-state" style={{marginTop:'2rem'}}>
                  <Compass size={48} className="empty-icon" />
                  <p>List is empty. Add locations to build your itinerary.</p>
                </div>
              ) : currentItinerary ? (
                <div className="ai-plan">
                  {currentItinerary.map((dayBlock, dayIndex) => {
                    const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
                    return (
                      <div key={dayBlock.day} style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${color}`, paddingLeft: '1rem' }}>
                        <div style={{ color: color, fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Day {dayBlock.day}: {dayBlock.theme}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {dayBlock.placeIds.map(pid => {
                            const placeObj = places.find(p => p.id === pid);
                            if(!placeObj) return null;
                            return (
                              <div className="itinerary-item" style={{ padding: '0.75rem 1rem' }} key={pid}>
                                  <div className="itinerary-item-info">
                                    <h4>{placeObj.name}</h4><p>{placeObj.city}</p>
                                  </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                activeList?.items.map(item => (
                  <div className="itinerary-item" key={item.id}>
                    <div className="itinerary-item-info"><h4>{item.name}</h4><p>{item.city}</p></div>
                    <button className="remove-btn" onClick={() => removeFromList(item.id)}><Trash2 size={18} /></button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </main>

      {/* Duration Modal */}
      {isDurationModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{ background: '#11141B', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setIsDurationModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap:'0.5rem' }}><Compass color="#FF6B00"/> Travel Duration</h2>
            <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>How many days are you staying? Our AI will organize the locations logically per day.</p>
            <input type="number" min="1" max="14" value={tripDurationDays} onChange={(e) => setTripDurationDays(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FF6B00', background: '#222', color: 'white', fontSize: '1.2rem', marginBottom: '1.5rem', outline: 'none' }} />
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerateItinerary}><Sparkles size={18} /> Generate Itinerary</button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

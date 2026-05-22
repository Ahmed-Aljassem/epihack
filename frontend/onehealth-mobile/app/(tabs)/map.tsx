import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useLang } from '@/utils/i18n';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
};

const FILTERS = ['All', 'People', 'Animals', 'Environment'];

// City-level macro stats (shown when zoomed out)
const CITIES = [
  { id: 'phx', name: 'Phoenix Metro', zip: 'Phoenix Area', count: 142, top: 'Flu A', lat: 33.4484, lng: -112.0740, trend: '+12' },
  { id: 'tuc', name: 'Tucson Area', zip: 'Tucson Area', count: 89, top: 'Stomach', lat: 32.2226, lng: -110.9747, trend: '-3' },
  { id: 'flg', name: 'Flagstaff', zip: '86001', count: 24, top: 'Cough', lat: 35.1983, lng: -111.6513, trend: '+5' },
  { id: 'yum', name: 'Yuma', zip: '85364', count: 18, top: 'Heat', lat: 32.6927, lng: -114.6277, trend: '+2' },
  { id: 'pre', name: 'Prescott', zip: '86301', count: 12, top: 'Allergies', lat: 34.5400, lng: -112.4685, trend: '0' },
];

// Zip-level micro stats (shown when zoomed in)
const ZIPS = [
  { name: 'Downtown PHX', zip: '85001', count: 60, top: 'Flu A', lat: 33.44, lng: -112.07, trend: '+5' },
  { name: 'North PHX', zip: '85032', count: 42, top: 'Flu B', lat: 33.62, lng: -112.00, trend: '+4' },
  { name: 'Glendale', zip: '85301', count: 40, top: 'Cough', lat: 33.54, lng: -112.18, trend: '+3' },
  { name: 'Downtown TUC', zip: '85701', count: 50, top: 'Stomach', lat: 32.22, lng: -110.97, trend: '-1' },
  { name: 'UofA Campus', zip: '85719', count: 39, top: 'Headache', lat: 32.24, lng: -110.95, trend: '-2' },
];

const AREAS = [...CITIES, ...ZIPS];

export default function MapScreen() {
  const { loc } = useLang();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const webviewRef = useRef<WebView>(null);

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  React.useEffect(() => {
    if (mapLoaded && userLoc) {
      const script = `
        if (window.map) {
           window.map.flyTo([${userLoc.lat}, ${userLoc.lng}], 10, { duration: 1.5 });
           
           // Blue User Dot
           L.circleMarker([${userLoc.lat}, ${userLoc.lng}], {
              radius: 8, fillColor: '#007AFF', color: '#FFF', weight: 3, opacity: 1, fillOpacity: 1
           }).addTo(window.map);
           
           // Soft blue radar glow
           L.circle([${userLoc.lat}, ${userLoc.lng}], {
              radius: 4000, fillColor: '#007AFF', color: '#007AFF', weight: 1, opacity: 0.3, fillOpacity: 0.1
           }).addTo(window.map);
        }
        true;
      `;
      webviewRef.current?.injectJavaScript(script);
    }
  }, [mapLoaded, userLoc]);

  const selArea = AREAS.find(x => x.zip === selected);

  const onMarkerPress = (zip: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(zip === selected ? null : zip);
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { padding: 0; margin: 0; background-color: #FAFAFA; }
            #map { height: 100vh; width: 100vw; }
            .leaflet-control-attribution { display: none; }
            
            .stat-marker {
                background: #FFFFFF;
                color: #0B6623;
                border: 2px solid #0B6623;
                border-radius: 50%;
                text-align: center;
                font-weight: 800;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-marker.selected {
                background: #0B6623;
                color: #FFFFFF;
                border: 2px solid #FFFFFF;
                transform: scale(1.1);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            window.map = L.map('map', { zoomControl: false }).setView([34.0489, -111.0937], 6);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19
            }).addTo(map);

            var cities = ${JSON.stringify(CITIES)};
            var zips = ${JSON.stringify(ZIPS)};
            var selectedZip = "${selected || ''}";
            
            var currentLayerGroup = L.layerGroup().addTo(map);

            function renderMarkers() {
                currentLayerGroup.clearLayers();
                var zoom = map.getZoom();
                var isZoomedIn = zoom >= 8;
                
                // Show Cities if zoomed out, Zips + Outer Cities if zoomed in
                var dataToShow = isZoomedIn ? [].concat(zips, cities.filter(c => c.id !== 'phx' && c.id !== 'tuc')) : cities;

                dataToShow.forEach(function(a) {
                    var isSelected = a.zip === selectedZip;
                    
                    // Translucent Heatmap Circle
                    L.circle([a.lat, a.lng], {
                        color: '#0B6623',
                        weight: isSelected ? 2 : 1,
                        fillColor: '#0B6623',
                        fillOpacity: isSelected ? 0.3 : 0.15,
                        radius: isZoomedIn ? 3000 + (a.count * 50) : 8000 + (a.count * 150)
                    }).addTo(currentLayerGroup);

                    // Clean white stat bubble
                    var size = a.count > 100 ? 36 : 30;
                    var icon = L.divIcon({
                        className: 'stat-marker ' + (isSelected ? 'selected' : ''),
                        html: a.count,
                        iconSize: [size, size],
                        iconAnchor: [size/2, size/2]
                    });
                    
                    var marker = L.marker([a.lat, a.lng], { icon: icon }).addTo(currentLayerGroup);
                    
                    marker.on('click', function() {
                        window.ReactNativeWebView.postMessage(a.zip);
                    });
                });
            }

            map.on('zoomend', renderMarkers);
            renderMarkers(); // Initial render

            // Smoothly pan map if selected
            if (selectedZip) {
                var allData = [].concat(cities, zips);
                var sel = allData.find(x => x.zip === selectedZip);
                if (sel) {
                    map.flyTo([sel.lat - 0.2, sel.lng], map.getZoom() > 8 ? map.getZoom() : 9, { duration: 0.5 });
                }
            }
        </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* Full Bleed Leaflet WebView Map */}
        <View style={{ height: Dimensions.get('window').height * 0.42, width: '100%', borderBottomWidth: 1.5, borderBottomColor: t.line }}>
          <WebView 
            ref={webviewRef}
            source={{ html: htmlContent }}
            style={{ flex: 1 }}
            scrollEnabled={false}
            onLoadEnd={() => setMapLoaded(true)}
            onMessage={(event) => {
              const zip = event.nativeEvent.data;
              onMarkerPress(zip);
            }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={14} color={t.sub} />
              <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>Arizona, US</Text>
            </View>
          </View>

          {selArea ? (
            <View style={{ paddingHorizontal: 24, flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <View>
                  <Text style={{ fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: t.text, letterSpacing: -0.5 }}>{selArea.name}</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Manrope_500Medium', color: t.sub, marginTop: 2 }}>{selArea.zip}</Text>
                </View>
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(null); }} 
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={16} color={t.text} />
                </TouchableOpacity>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: t.card, borderWidth: 1.5, borderColor: t.line, borderRadius: 14, padding: 16 }}>
                  <Text style={{ color: t.sub, fontSize: 12, fontFamily: 'Manrope_700Bold', textTransform: 'uppercase', letterSpacing: 1.2 }}>{loc.total_rep || 'Total Reports'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 32, fontFamily: 'Manrope_800ExtraBold', color: t.text, letterSpacing: -1 }}>{selArea.count}</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Manrope_700Bold', color: t.sub }}>{selArea.trend}</Text>
                  </View>
                </View>
                
                <View style={{ flex: 1, backgroundColor: t.accentSoft, borderWidth: 1.5, borderColor: t.accentMid, borderRadius: 14, padding: 16 }}>
                  <Text style={{ color: t.accent, fontSize: 12, fontFamily: 'Manrope_700Bold', textTransform: 'uppercase', letterSpacing: 1.2 }}>{loc.top_iss || 'Top Issue'}</Text>
                  <Text style={{ fontSize: 20, fontFamily: 'Manrope_700Bold', color: t.accent, marginTop: 8, letterSpacing: -0.3 }}>{selArea.top}</Text>
                </View>
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}
                contentContainerStyle={{ gap: 8 }}>
                {FILTERS.map(f => {
                  const on = filter === f;
                  return (
                    <TouchableOpacity key={f} activeOpacity={0.7}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
                      style={{
                        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100,
                        backgroundColor: on ? t.text : t.card,
                        borderWidth: 1.5, borderColor: on ? t.text : t.line,
                      }}>
                      <Text style={{ color: on ? '#FFF' : t.text, fontSize: 14, fontFamily: on ? 'Manrope_700Bold' : 'Manrope_600SemiBold' }}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {CITIES.sort((a, b) => b.count - a.count).map((a, i) => (
                <TouchableOpacity key={i} activeOpacity={0.7}
                  onPress={() => onMarkerPress(a.zip)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: t.card, borderRadius: 14,
                    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
                    borderWidth: 1.5, borderColor: t.line,
                  }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="location-outline" size={16} color={t.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: t.text, fontFamily: 'Manrope_700Bold', letterSpacing: -0.3 }}>{a.name}</Text>
                    <Text style={{ fontSize: 13, color: t.sub, fontFamily: 'Manrope_500Medium', marginTop: 2 }}>{a.zip} · {a.top}</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: t.text, fontFamily: 'Manrope_800ExtraBold' }}>{a.count}</Text>
                  <Ionicons name="chevron-forward" size={14} color={t.hint} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

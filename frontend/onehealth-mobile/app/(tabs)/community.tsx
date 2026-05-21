import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const t = {
  bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
  hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
  accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
};

interface Post {
  id: string; author: string; area: string; time: string; body: string;
  votes: number; comments: number; verified?: boolean; aiTag?: string;
}

const POSTS: Post[] = [
  { id: '1', author: 'Anonymous', area: 'UofA area', time: '2h ago', body: 'Something going around the dorms. Three people on my floor have the same cough and fever since Monday.', votes: 23, comments: 5, aiTag: 'Matches elevated flu activity nearby' },
  { id: '2', author: 'Anonymous', area: 'Rillito Creek', time: '5h ago', body: 'Found multiple dead pigeons near the trail. At least 4-5 in a short stretch.', votes: 12, comments: 3, aiTag: '3 other dead bird reports this week' },
  { id: '3', author: 'Anonymous', area: 'UofA area', time: '1d ago', body: 'My whole study group got sick after eating at the same place on University Blvd. All stomach issues.', votes: 31, comments: 8 },
  { id: '4', author: 'Anonymous', area: 'Green Valley', time: '1d ago', body: 'Way more mosquitoes than usual. Standing water everywhere after the rain.', votes: 8, comments: 2, aiTag: 'Mosquito conditions favorable in 85614' },
  { id: '5', author: 'Campus Health', area: 'UofA area', time: '6h ago', body: 'Seeing higher than usual flu cases this week. If symptomatic, stay home. Walk-in hours 8am-4pm.', votes: 67, comments: 12, verified: true },
];

export default function CommunityScreen() {
  const [posts, setPosts] = useState(POSTS);

  const upvote = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(p => p.map(x => x.id === id ? { ...x, votes: x.votes + 1 } : x));
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10 }}>
          <Text style={{ fontSize: 28, fontFamily: 'Manrope_700Bold', color: t.text, letterSpacing: -0.6 }}>Community</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="location-outline" size={12} color={t.sub} />
            <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.sub, fontSize: 13 }}>Tucson, AZ</Text>
          </View>
        </View>

        <FlatList
          data={posts} keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100, paddingHorizontal: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/post-detail', params: { id: item.id } }); }}
              style={{
                backgroundColor: item.verified ? t.accentSoft : t.card,
                borderRadius: 14, padding: 16, marginBottom: 10,
                borderWidth: item.verified ? 1.5 : 0,
                borderColor: item.verified ? t.accent : 'transparent',
              }}>

              {/* Meta */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: item.verified ? t.accentMid : t.fill,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={item.verified ? 'shield-checkmark' : 'person'} size={11} color={item.verified ? t.accent : t.hint} />
                </View>
                <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.sub, fontSize: 11 }}>
                  {item.verified ? item.author : 'Anonymous'} · {item.area} · {item.time}
                </Text>
              </View>

              {/* Body */}
              <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.text, fontSize: 14, lineHeight: 21 }}>{item.body}</Text>

              {/* Actions */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
                <TouchableOpacity onPress={() => upvote(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="arrow-up-outline" size={15} color={t.hint} />
                  <Text style={{ color: t.hint, fontSize: 12, fontFamily: 'Manrope_500Medium' }}>{item.votes}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chatbubble-outline" size={13} color={t.hint} />
                  <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.hint, fontSize: 12 }}>{item.comments}</Text>
                </View>
              </View>

              {/* AI insight */}
              {item.aiTag && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <Ionicons name="sparkles-outline" size={12} color={t.accent} />
                  <Text style={{ color: t.accent, fontSize: 11, fontFamily: 'Manrope_500Medium' }}>{item.aiTag}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />

        {/* Compose */}
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/compose'); }}
          style={{
            position: 'absolute', bottom: 20, right: 20,
            width: 50, height: 50, borderRadius: 25, backgroundColor: t.accent,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <Ionicons name="pencil-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

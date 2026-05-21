import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const GREEN = '#0B6623';
const BG = '#FAFAFA';
const CARD = '#FFFFFF';
const TEXT = '#111111';
const BODY = '#444444';
const SUB = '#777777';
const HINT = '#B0B0B0';
const LINE = '#F0F0F0';
const FILL = '#F5F5F5';

const REPLIES = [
  { author: 'Anonymous', time: '1h ago', body: 'Same here! My roommate just got diagnosed with Flu A yesterday.' },
  { author: 'Anonymous', time: '45 min ago', body: 'Campus Health was packed this morning. Waited 2 hours.' },
  { author: 'Campus Health', time: '30 min ago', body: 'We recommend scheduling appointments online to reduce wait times. Walk-ins still accepted 8am-4pm.', verified: true },
];

export default function PostDetailScreen() {
  const [reply, setReply] = useState('');

  const post = {
    author: 'Anonymous', area: 'UofA area', time: '2h',
    body: 'Something going around the dorms. Three people on my floor have the same cough and fever since Monday.',
    votes: 23, comments: 5,
    aiTag: 'Matches elevated flu activity nearby',
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: FILL, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={TEXT} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: TEXT, marginLeft: 12 }}>Post</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>

            <View style={{ backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LINE, marginBottom: 20 }}>
              <Text style={{ color: HINT, fontSize: 12 }}>{post.author} · {post.area} · {post.time}</Text>
              <Text style={{ color: BODY, fontSize: 15, lineHeight: 22, marginTop: 8 }}>{post.body}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="arrow-up-outline" size={14} color={HINT} />
                  <Text style={{ color: HINT, fontSize: 12, fontWeight: '500' }}>{post.votes}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chatbubble-outline" size={12} color={HINT} />
                  <Text style={{ color: HINT, fontSize: 12 }}>{post.comments}</Text>
                </View>
              </View>
              {post.aiTag && <Text style={{ color: GREEN, fontSize: 12, marginTop: 8 }}>{post.aiTag}</Text>}
            </View>

            <Text style={{ color: HINT, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 2 }}>Replies</Text>
            {REPLIES.map((r, i) => (
              <View key={i} style={{ backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: LINE }}>
                <Text style={{ color: r.verified ? GREEN : HINT, fontSize: 12, fontWeight: r.verified ? '600' : '400' }}>
                  {r.author} · {r.time}
                </Text>
                <Text style={{ color: BODY, fontSize: 14, lineHeight: 20, marginTop: 6 }}>{r.body}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 0.5, borderColor: LINE, backgroundColor: CARD }}>
            <TextInput style={{ flex: 1, backgroundColor: FILL, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, color: TEXT, fontSize: 14 }}
              placeholder="Add a reply..." placeholderTextColor={HINT} value={reply} onChangeText={setReply} />
            <TouchableOpacity disabled={!reply.trim()} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReply(''); }}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: reply.trim() ? GREEN : FILL, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="send" size={14} color={reply.trim() ? '#FFF' : HINT} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

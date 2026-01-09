'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// 타입 정의
interface Member {
  id: string
  name: string
  memo: string
  tags: MemberTag[] | null
  created_at: number
  updated_at: number | null
}

interface MemberTag {
  text: string
  icon: string
  color: string
}

interface MemberExercise {
  id: string
  member_id: string
  exercise_id: string
  can_perform: boolean
}

interface Exercise {
  id: string
  name: string
}

interface MemberInvite {
  id: string
  member_id: string
  invite_code: string
  expires_at: number
}

export default function MemberDetailPage() {
  const params = useParams()
  const inviteCode = params.inviteCode as string

  const [member, setMember] = useState<Member | null>(null)
  const [exercises, setExercises] = useState<{ exercise: Exercise; canPerform: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. invite_code로 member_id 조회
        const { data: invite, error: inviteError } = await supabase
          .from('member_invite')
          .select('*')
          .eq('invite_code', inviteCode)
          // .gt('expires_at', Date.now())
          .maybeSingle()

        if (inviteError || !invite) {
          setError('유효하지 않거나 만료된 초대 링크입니다.')
          setLoading(false)
          return
        }

        // 2. member 정보 조회
        const { data: memberData, error: memberError } = await supabase
          .from('member')
          .select('*')
          .eq('id', invite.member_id)
          .maybeSingle()

        console.log('memberData:', memberData)

        if (memberError || !memberData) {
          setError('회원 정보를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        setMember(memberData)

        // 3. member_exercises 조회
        const { data: memberExercises, error: meError } = await supabase
          .from('member_exercises')
          .select('*')
          .eq('member_id', invite.member_id)

        if (meError) {
          console.error('운동 목록 조회 실패:', meError)
        }

        // 4. exercises 조회 (운동 이름 가져오기)
        if (memberExercises && memberExercises.length > 0) {
          const exerciseIds = memberExercises.map((me) => me.exercise_id)
          
          const { data: exercisesData, error: exError } = await supabase
            .from('exercises')
            .select('*')
            .in('id', exerciseIds)

          if (!exError && exercisesData) {
            const combined = memberExercises.map((me) => ({
              exercise: exercisesData.find((ex) => ex.id === me.exercise_id)!,
              canPerform: me.can_perform,
            })).filter((item) => item.exercise)

            setExercises(combined)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('데이터 로딩 실패:', err)
        setError('데이터를 불러오는데 실패했습니다.')
        setLoading(false)
      }
    }

    if (inviteCode) {
      fetchData()
    }
  }, [inviteCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <header className="bg-gray-800 py-4 px-6">
        <h1 className="text-xl font-semibold">{member?.name} 님 운동 현황</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {/* 프로필 섹션 */}
        <section className="text-center mb-8">
          {/* 프로필 이미지 */}
          <div className="w-24 h-24 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl font-bold">
              {member?.name?.charAt(0) || '?'}
            </span>
          </div>
          
          {/* 이름 */}
          <h2 className="text-2xl font-bold mb-4">{member?.name}</h2>
          
          {/* 태그 */}
          {member?.tags && member.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {member.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tag.color === 'PRIMARY'
                      ? 'bg-blue-500/20 text-blue-400'
                      : tag.color === 'WARNING'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {tag.icon} {tag.text}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 메모 카드 */}
        {member?.memo && (
          <section className="bg-gray-800 rounded-2xl p-4 mb-6">
            <div className="flex justify-between text-gray-400 text-sm mb-2">
              <span>최근 메모</span>
              <span>
                {member.updated_at
                  ? new Date(member.updated_at).toLocaleDateString('ko-KR')
                  : new Date(member.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <p className="text-gray-200">{member.memo}</p>
          </section>
        )}

        {/* 운동 목록 */}
        <section>
          <h3 className="text-lg font-bold mb-4">운동 종목</h3>
          <div className="space-y-3">
            {exercises.map((item) => (
              <Link
                href={`/exercise/${item.exercise.id}`}
                key={item.exercise.id}
                className="bg-gray-800 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-750 transition-colors"
              >
                {/* 아이콘 */}
                <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center text-2xl">
                  {getExerciseEmoji(item.exercise.name)}
                </div>
                
                {/* 운동 정보 */}
                <div className="flex-1">
                  <div className="font-semibold">{item.exercise.name}</div>
                  <div
                    className={`text-sm ${
                      item.canPerform ? 'text-green-400' : 'text-gray-400'
                    }`}
                  >
                    {item.canPerform ? '수행 가능' : '수행 불가'}
                  </div>
                </div>

                {/* 상태 표시 */}
                <div
                  className={`w-4 h-4 rounded-full ${
                    item.canPerform ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </Link>
            ))}

            {exercises.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                등록된 운동이 없습니다.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="text-center text-gray-500 text-sm py-8">
        MuscleAtlas
      </footer>
    </div>
  )
}

// 운동 이름에 따른 이모지 반환
function getExerciseEmoji(name: string): string {
  if (name.includes('벤치') || name.includes('프레스')) return '💪'
  if (name.includes('데드')) return '🏋️'
  if (name.includes('스쿼트')) return '🦵'
  if (name.includes('플랭크') || name.includes('코어')) return '⏱️'
  if (name.includes('풀업') || name.includes('턱걸이')) return '💪'
  if (name.includes('런지')) return '🦿'
  return '🏃'
}

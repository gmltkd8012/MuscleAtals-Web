'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Exercise {
  id: string
  name: string
  created_at: string
}

interface ExerciseDetail {
  id: string
  exercise_id: string
  movement_type: string      // 기계적 움직임, 안정화 기전
  contraction_type: string   // Eccentric, Concentric, ROM 말단 고려 등
  detail_category: string | null  // Primary, Secondary, 주동근 등
  description: string | null
  created_at: string
}

// 그룹화된 상세 정보 타입
type GroupedDetails = {
  [movementType: string]: {
    [contractionType: string]: ExerciseDetail[]
  }
}

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const exerciseId = params.exerciseId as string

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [groupedDetails, setGroupedDetails] = useState<GroupedDetails>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('exerciseId:', exerciseId)

        // 1. exercise 정보 조회
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', exerciseId)
          .maybeSingle()

        console.log('exercise:', exerciseData, exerciseError)

        if (exerciseError || !exerciseData) {
          setError('운동 정보를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        setExercise(exerciseData)

        // 2. exercise_details 조회
        const { data: details, error: detailsError } = await supabase
          .from('exercise_details')
          .select('*')
          .eq('exercise_id', exerciseId)

        console.log('details:', details, detailsError)

        if (!detailsError && details) {
          // 그룹화: movement_type -> contraction_type -> details[]
          const grouped: GroupedDetails = {}
          details.forEach((detail) => {
            if (!grouped[detail.movement_type]) {
              grouped[detail.movement_type] = {}
            }
            if (!grouped[detail.movement_type][detail.contraction_type]) {
              grouped[detail.movement_type][detail.contraction_type] = []
            }
            grouped[detail.movement_type][detail.contraction_type].push(detail)
          })
          setGroupedDetails(grouped)
        }

        setLoading(false)
      } catch (err) {
        console.error('데이터 로딩 실패:', err)
        setError('데이터를 불러오는데 실패했습니다.')
        setLoading(false)
      }
    }

    if (exerciseId) {
      fetchData()
    }
  }, [exerciseId])

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

  // Movement Mechanics 데이터
  const mechanicsData = groupedDetails['기계적 움직임'] || {}
  const eccentricDetails = mechanicsData['Eccentric'] || []
  const concentricDetails = mechanicsData['Concentric'] || []

  // Technical Breakdown 데이터 (Eccentric, Concentric, 근육 분석 제외)
  const technicalEntries = Object.entries(mechanicsData).filter(
    ([key]) => key !== 'Eccentric' && key !== 'Concentric' && key !== '근육 분석'
  )

  // Stabilization 데이터
  const stabilizationData = groupedDetails['안정화 기전'] || {}

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <header className="bg-gray-800 py-4 px-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-semibold">운동 종목 상세</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Hero Image Section */}
        <section className="w-full h-48 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-6xl mb-2">{getExerciseEmoji(exercise?.name || '')}</span>
          <span className="text-gray-400 text-sm">Exercise Image</span>
        </section>

        {/* 운동 이름 */}
        <h2 className="text-3xl font-bold">{exercise?.name}</h2>

        {/* 태그 */}
        <div className="flex gap-2">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
            COMPOUND
          </span>
        </div>

        {/* Movement Mechanics */}
        {(eccentricDetails.length > 0 || concentricDetails.length > 0) && (
          <>
            <SectionTitle title="MOVEMENT MECHANICS" />
            <div className="grid grid-cols-2 gap-3">
              {/* Phase Card */}
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-cyan-400">⇅</span>
                  <span className="text-cyan-400 text-xs font-bold">PHASE</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-400 text-xs">DESCENDING</div>
                    <div className="text-white text-sm font-medium">
                      {eccentricDetails.find(d => d.detail_category === 'Primary')?.description || 'Flexion'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">ASCENDING</div>
                    <div className="text-white text-sm font-medium">
                      {concentricDetails.find(d => d.detail_category === 'Primary')?.description || 'Extension'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contraction Card */}
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400">⇅</span>
                  <span className="text-blue-400 text-xs font-bold">CONTRACTION</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-400 text-xs">LOWERING</div>
                    <div className="text-white text-sm font-medium">Eccentric</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">LIFTING</div>
                    <div className="text-white text-sm font-medium">Concentric</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Technical Breakdown */}
        {technicalEntries.length > 0 && (
          <>
            <SectionTitle title="TECHNICAL BREAKDOWN" />
            <div className="space-y-3">
              {technicalEntries.map(([contractionType, details]) => (
                <TechnicalCard
                  key={contractionType}
                  title={contractionType}
                  details={details}
                />
              ))}
            </div>
          </>
        )}

        {/* Stabilization & Safety */}
        {Object.keys(stabilizationData).length > 0 && (
          <>
            <SectionTitle title="STABILIZATION & SAFETY" />
            <div className="space-y-3">
              {Object.entries(stabilizationData).map(([contractionType, details]) => (
                <SafetyCard
                  key={contractionType}
                  title={contractionType}
                  details={details}
                />
              ))}
            </div>
          </>
        )}

        {/* 상세 정보 없을 때 */}
        {Object.keys(groupedDetails).length === 0 && (
          <section className="bg-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-400">
              아직 상세 정보가 등록되지 않았습니다.
            </p>
          </section>
        )}
      </main>

      <footer className="text-center text-gray-500 text-sm py-8">
        MuscleAtlas
      </footer>
    </div>
  )
}

// 섹션 타이틀
function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-gray-400 text-xs font-bold tracking-wider pt-4">
      {title}
    </h3>
  )
}

// Technical 카드
function TechnicalCard({ title, details }: { title: string; details: ExerciseDetail[] }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h4 className="text-white font-semibold mb-3">{title}</h4>
      <div className="space-y-2">
        {details.map((detail) => (
          <div key={detail.id} className="flex gap-2">
            {detail.detail_category && (
              <span className="text-blue-400 text-sm font-medium min-w-[80px]">
                {detail.detail_category}
              </span>
            )}
            <span className="text-gray-300 text-sm">{detail.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Safety 카드
function SafetyCard({ title, details }: { title: string; details: ExerciseDetail[] }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border-l-4 border-amber-500">
      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-amber-500">⚠️</span>
        {title}
      </h4>
      <div className="space-y-2">
        {details.map((detail) => (
          <div key={detail.id} className="flex gap-2">
            {detail.detail_category && (
              <span className="text-amber-400 text-sm font-medium min-w-[80px]">
                {detail.detail_category}
              </span>
            )}
            <span className="text-gray-300 text-sm">{detail.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getExerciseEmoji(name: string): string {
  if (name.includes('벤치') || name.includes('프레스')) return '💪'
  if (name.includes('데드')) return '🏋️'
  if (name.includes('스쿼트')) return '🦵'
  if (name.includes('풀업') || name.includes('턱걸이')) return '💪'
  if (name.includes('플랭크') || name.includes('코어')) return '⏱️'
  if (name.includes('런지')) return '🦿'
  return '🏃'
}

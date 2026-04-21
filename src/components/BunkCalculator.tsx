import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, X } from 'lucide-react-native';
import { useProfile } from '../context/ProfileContext';
import { getAttendanceColor } from '../utils/attendance';

interface Subject {
  id: string;
  name: string;
  attendedClasses?: number;
  totalClasses?: number;
}

interface BunkCalculatorProps {
  subjects: Subject[];
}

export default function BunkCalculator({ subjects }: BunkCalculatorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { profile } = useProfile();
  const targetPercentage = profile.minAttendance;

  function getColor(percentage: number) {
    const c = getAttendanceColor(percentage, targetPercentage);
    return { text: c, bg: `${c}18`, border: `${c}40` };
  }

  const calculations = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];

    return subjects.map(subject => {
      const attended = Number(subject.attendedClasses) || 0;
      const total = Number(subject.totalClasses) || 0;

      // Safe percentage without external dependencies
      const currentPercentage =
        total > 0 ? (attended / total) * 100 : 0;

      let status: 'can_bunk' | 'needs_attention' = 'needs_attention';
      let classesToAttend = 0;
      let classesCanBunk = 0;

      // Guard invalid target values
      if (!targetPercentage || targetPercentage <= 0 || targetPercentage >= 100) {
        return {
          ...subject,
          currentPercentage,
          status: 'needs_attention',
          classesCanBunk: 0,
          classesToAttend: 0,
        };
      }

      // If already above target, classes can be bunked
      if (currentPercentage >= targetPercentage) {
        const maxTotalClasses = (attended * 100) / targetPercentage;

        classesCanBunk = Math.floor(maxTotalClasses - total);

        // Safety clamps
        if (!isFinite(classesCanBunk) || isNaN(classesCanBunk)) {
          classesCanBunk = 0;
        }

        classesCanBunk = Math.max(0, classesCanBunk);
        status = 'can_bunk';
      } 
      // If below target, more classes need to be attended
      else {
        const numerator = (targetPercentage * total) - (100 * attended);
        const denominator = 100 - targetPercentage;

        if (denominator > 0) {
          classesToAttend = Math.ceil(numerator / denominator);
        }

        // Safety clamps
        if (!isFinite(classesToAttend) || isNaN(classesToAttend)) {
          classesToAttend = 0;
        }

        classesToAttend = Math.max(0, classesToAttend);
        status = 'needs_attention';
      }

      return {
        ...subject,
        currentPercentage,
        status,
        classesCanBunk,
        classesToAttend,
      };
    });
  }, [subjects, targetPercentage]);

  return (
    <>
      {/* Open button */}
      <TouchableOpacity
        className="bg-white rounded-3xl p-5 mx-4 mt-5 flex-row items-center border border-neutral-200"
        onPress={() => setModalVisible(true)}
      >
        <View className="w-12 h-12 rounded-2xl bg-[#4dc591]/20 items-center justify-center mr-4">
          <Calculator size={24} color="#4dc591" />
        </View>

        <View className="flex-1">
          <Text className="text-text font-bold text-lg">
            Bunk Calculator
          </Text>
          <Text className="text-text-muted text-sm mt-1">
            See how many classes you can skip
          </Text>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100">
            <Text className="text-text text-xl font-bold">
              Bunk Calculator
            </Text>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <X size={18} color="#5f8a85" />
            </TouchableOpacity>
          </View>

          {/* Target info */}
          <View className="px-5 pt-5 pb-3">
            <Text className="text-text-muted text-sm">
              Target: <Text className="font-bold text-text">{targetPercentage}%</Text>
              <Text className="text-text-muted">  (change in Settings)</Text>
            </Text>
          </View>

          {/* Results */}
          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
            {calculations.map(calc => {
              const color = getColor(calc.currentPercentage);
              return (
                <View
                  key={calc.id}
                  className="p-4 rounded-3xl mb-3"
                  style={{ backgroundColor: color.bg, borderWidth: 1, borderColor: color.border }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text text-sm font-semibold flex-1 mr-2">
                      {calc.name}
                    </Text>
                    <Text style={{ color: color.text }} className="text-sm font-bold">
                      {calc.currentPercentage.toFixed(1)}%
                    </Text>
                  </View>

                  <View className="mt-2">
                    {calc.status === 'can_bunk' ? (
                      calc.classesCanBunk > 0 ? (
                        <Text style={{ color: color.text }}>
                          You can skip{" "}
                          <Text className="font-bold">{calc.classesCanBunk}</Text>{" "}
                          classes
                        </Text>
                      ) : (
                        <Text style={{ color: color.text }}>
                          Right at the limit — no bunks left
                        </Text>
                      )
                    ) : (
                      <Text style={{ color: color.text }}>
                        Attend{" "}
                        <Text className="font-bold">{calc.classesToAttend}</Text>{" "}
                        more to reach {targetPercentage}%
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

        </SafeAreaView>
      </Modal>
    </>
  );
}
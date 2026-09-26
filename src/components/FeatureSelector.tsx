import React from 'react';
import { Sparkles, Lightbulb, FileText, GraduationCap, Code2, Check } from 'lucide-react';
import { FeatureType } from '../types';
import { FEATURES } from '../data/features';

interface FeatureSelectorProps {
  activeFeature: FeatureType;
  onSelectFeature: (feature: FeatureType) => void;
  disabled?: boolean;
}

interface ToolTheme {
  iconBg: string;
  iconColor: string;
  activeBg: string;
  activeBorder: string;
  activeRing: string;
  tag: string;
}

const TOOL_THEMES: Record<FeatureType, ToolTheme> = {
  ask: {
    iconBg: 'bg-blue-50 text-blue-600',
    iconColor: 'text-blue-600',
    activeBg: 'bg-blue-50/50',
    activeBorder: 'border-blue-600',
    activeRing: 'ring-blue-500/15',
    tag: 'Instant Q&A',
  },
  explain: {
    iconBg: 'bg-amber-50 text-amber-600',
    iconColor: 'text-amber-600',
    activeBg: 'bg-amber-50/40',
    activeBorder: 'border-amber-600',
    activeRing: 'ring-amber-500/15',
    tag: 'Deep Concept',
  },
  notes: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    iconColor: 'text-emerald-600',
    activeBg: 'bg-emerald-50/40',
    activeBorder: 'border-emerald-600',
    activeRing: 'ring-emerald-500/15',
    tag: 'Revision Sheet',
  },
  practice: {
    iconBg: 'bg-purple-50 text-purple-600',
    iconColor: 'text-purple-600',
    activeBg: 'bg-purple-50/40',
    activeBorder: 'border-purple-600',
    activeRing: 'ring-purple-500/15',
    tag: 'Mock Test',
  },
  code: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    iconColor: 'text-indigo-600',
    activeBg: 'bg-indigo-50/40',
    activeBorder: 'border-indigo-600',
    activeRing: 'ring-indigo-500/15',
    tag: 'Code & Debug',
  },
};

const getFeatureIcon = (id: FeatureType, className: string) => {
  switch (id) {
    case 'ask':
      return <Sparkles className={className} />;
    case 'explain':
      return <Lightbulb className={className} />;
    case 'notes':
      return <FileText className={className} />;
    case 'practice':
      return <GraduationCap className={className} />;
    case 'code':
      return <Code2 className={className} />;
  }
};

const getFeatureDescription = (id: FeatureType): string => {
  switch (id) {
    case 'ask':
      return 'Instant answers for theory, concepts & formulas';
    case 'explain':
      return 'Simple breakdowns with real-world analogies';
    case 'notes':
      return 'High-yield summaries & quick revision points';
    case 'practice':
      return 'Mock test questions with step-by-step solutions';
    case 'code':
      return 'Algorithm logic, syntax breakdown & error fixes';
  }
};

export const FeatureSelector: React.FC<FeatureSelectorProps> = ({
  activeFeature,
  onSelectFeature,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Study Tool
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">5 Specialized Academic Tools</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {FEATURES.map((feat) => {
          const isSelected = activeFeature === feat.id;
          const theme = TOOL_THEMES[feat.id];

          return (
            <button
              key={feat.id}
              id={`feature-btn-${feat.id}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectFeature(feat.id)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all min-h-[58px] sm:min-h-[128px] touch-manipulation cursor-pointer group relative ${
                isSelected
                  ? `${theme.activeBg} ${theme.activeBorder} ring-3 ${theme.activeRing} shadow-xs text-slate-900`
                  : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs hover:shadow-xs'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'}`}
            >
              {/* Tool Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : `${theme.iconBg} group-hover:brightness-95`
                }`}
              >
                {getFeatureIcon(feat.id, 'w-5 h-5')}
              </div>

              {/* Tool Metadata */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <h3
                    className={`text-xs sm:text-sm font-bold leading-tight tracking-tight ${
                      isSelected ? 'text-slate-900' : 'text-slate-800 group-hover:text-slate-900'
                    }`}
                  >
                    {feat.title}
                  </h3>

                  {isSelected ? (
                    <span className="shrink-0 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {theme.tag}
                    </span>
                  )}
                </div>

                <p
                  className={`text-[11px] sm:text-xs leading-snug ${
                    isSelected ? 'text-slate-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  {getFeatureDescription(feat.id)}
                </p>
              </div>

              {/* Bottom active accent bar on desktop */}
              {isSelected && (
                <div className="hidden sm:block absolute bottom-0 left-3 right-3 h-[2.5px] bg-slate-900 rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};


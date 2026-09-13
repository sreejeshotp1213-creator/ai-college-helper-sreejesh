import React from 'react';
import { Sparkles, Lightbulb, FileText, GraduationCap, Code2 } from 'lucide-react';
import { FeatureType } from '../types';
import { FEATURES } from '../data/features';

interface FeatureSelectorProps {
  activeFeature: FeatureType;
  onSelectFeature: (feature: FeatureType) => void;
  disabled?: boolean;
}

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

export const FeatureSelector: React.FC<FeatureSelectorProps> = ({
  activeFeature,
  onSelectFeature,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Choose a Study Tool
        </label>
        <span className="text-xs text-slate-400">5 Modes Available</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {FEATURES.map((feat) => {
          const isSelected = activeFeature === feat.id;
          return (
            <button
              key={feat.id}
              id={`feature-btn-${feat.id}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectFeature(feat.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all min-h-[64px] touch-manipulation active:scale-[0.98] ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-950 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2 w-full mb-1">
                <span
                  className={`p-1.5 rounded-lg ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {getFeatureIcon(feat.id, 'w-4 h-4')}
                </span>
                <span className="font-semibold text-xs leading-snug">
                  {feat.shortLabel}
                </span>
              </div>
              <p
                className={`text-[11px] line-clamp-1 mt-auto ${
                  isSelected ? 'text-blue-700 font-medium' : 'text-slate-400'
                }`}
              >
                {feat.id === 'ask' && 'Instant answers'}
                {feat.id === 'explain' && 'Simple concepts'}
                {feat.id === 'notes' && 'Quick revision'}
                {feat.id === 'practice' && 'Exam prep questions'}
                {feat.id === 'code' && 'Explain code & bugs'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

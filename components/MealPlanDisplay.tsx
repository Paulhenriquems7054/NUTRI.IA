
import React, { useRef, useState } from 'react';
import type { Meal, MealPlan } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useUser } from '../context/UserContext';
import { explainMeal } from '../services/geminiService';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { useI18n } from '../context/I18nContext';

declare const jspdf: any;
declare const html2canvas: any;

interface MealPlanDisplayProps {
  plan: MealPlan;
  observations: string;
}

const MealPlanDisplay: React.FC<MealPlanDisplayProps> = ({ plan, observations }) => {
  const { user } = useUser();
  const { t } = useI18n();
  const planRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', explanation: '' });
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  const handleExportPDF = () => {
    if (planRef.current) {
      const { jsPDF } = jspdf;
      html2canvas(planRef.current, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();
        }
        pdf.save('plano-alimentar-nutri-ia.pdf');
      });
    }
  };
  
  const handleExplainMeal = async (meal: Meal) => {
    setIsModalOpen(true);
    setIsExplanationLoading(true);
    setModalContent({ title: `${t('meal_plan.explanation.title')} ${meal.refeicao}`, explanation: '' });
    try {
        const explanation = await explainMeal(meal.refeicao, user);
        setModalContent(prev => ({ ...prev, explanation }));
    } catch (error) {
        console.error(error);
        setModalContent(prev => ({ ...prev, explanation: t('meal_plan.explanation.error') }));
    } finally {
        setIsExplanationLoading(false);
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('meal_plan.title')}</h2>
            <Button
              onClick={handleExportPDF}
              variant="secondary"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {t('meal_plan.export_pdf')}
            </Button>
          </div>

          <div ref={planRef} className="p-2">
              <div className="space-y-6">
              {plan.map((meal) => (
                  <div key={meal.refeicao} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg text-primary-700 dark:text-primary-400">{meal.refeicao}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{meal.horario_sugerido}</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleExplainMeal(meal)}>
                            {t('meal_plan.why_this_meal')}
                        </Button>
                    </div>
                    <ul className="mt-3 list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                        {meal.alimentos.map((food, index) => (
                        <li key={index}>{food}</li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end text-xs space-x-4 text-slate-500 dark:text-slate-400">
                        <span>{meal.calorias} kcal</span>
                        <span>P: {meal.macros.proteinas_g}g</span>
                        <span>C: {meal.macros.carboidratos_g}g</span>
                        <span>G: {meal.macros.gorduras_g}g</span>
                    </div>
                  </div>
              ))}
              {observations && (
                <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/30 rounded-lg border border-sky-200 dark:border-sky-800">
                  <h4 className="font-semibold text-sky-800 dark:text-sky-300">{t('meal_plan.observations_title')}</h4>
                  <p className="mt-2 text-sm text-sky-700 dark:text-sky-200 whitespace-pre-wrap">{observations}</p>
                </div>
              )}
              </div>
          </div>
        </div>
      </Card>
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" aria-modal="true">
            <Card className="w-full max-w-lg mx-4 animate-fade-in-up">
                 <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary-500"/>
                        {modalContent.title}
                    </h2>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="p-6 min-h-[100px]">
                    {isExplanationLoading ? (
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className="text-slate-600 dark:text-slate-300">{modalContent.explanation}</p>
                    )}
                </div>
            </Card>
        </div>
      )}
    </>
  );
};

export default MealPlanDisplay;

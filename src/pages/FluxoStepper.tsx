import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

// Componente de Indicadores
const StepIndicators = ({ currentStep, confirmedSteps }) => {
  const steps = [
    { number: 1, label: "Configuração Inicial" },
    { number: 2, label: "Ação Obrigatória" },
    { number: 3, label: "Revisão Final" }
  ];

  const getStepState = (stepNumber) => {
    if (stepNumber < currentStep || confirmedSteps[stepNumber]) return "completed";
    if (stepNumber === currentStep) return "current";
    return "future";
  };

  return (
    <div className="relative mb-12">
      {/* Linha de conexão */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300" style={{ zIndex: 0 }}></div>
      
      <div className="relative flex justify-between" style={{ zIndex: 1 }}>
        {steps.map((step) => {
          const state = getStepState(step.number);
          
          return (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  state === "completed"
                    ? "bg-green-500 text-white"
                    : state === "current"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {state === "completed" ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className="mt-2 text-xs sm:text-sm font-medium text-gray-700 text-center hidden sm:block max-w-[120px]">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente Passo 1
const Step1 = ({ nome, setNome, onConfirm, isConfirmed, onNext, error }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full flex-shrink-0 px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4" tabIndex={-1}>
        Passo 1: Definir o seu Nome
      </h2>
      <p className="text-gray-600 mb-6">
        Por favor, insira o seu nome completo para prosseguir com o fluxo.
      </p>

      <div className="mb-6">
        <label htmlFor="nome-input" className="block text-sm font-medium text-gray-700 mb-2">
          Nome Completo
        </label>
        <input
          ref={inputRef}
          id="nome-input"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "nome-error" : undefined}
        />
        {error && (
          <p id="nome-error" className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {!isConfirmed ? (
          <Button
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Confirmar Ação
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Avançar
          </Button>
        )}
      </div>
    </div>
  );
};

// Componente Passo 2
const Step2 = ({ termosAceitos, setTermosAceitos, onConfirm, isConfirmed, onNext, onBack, error }) => {
  const checkboxRef = useRef(null);

  useEffect(() => {
    checkboxRef.current?.focus();
  }, []);

  return (
    <div className="w-full flex-shrink-0 px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4" tabIndex={-1}>
        Passo 2: Aceitar os Termos
      </h2>
      <p className="text-gray-600 mb-6">
        Para continuar, você precisa ler e aceitar os Termos de Serviço e a Política de Privacidade.
      </p>

      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={termosAceitos}
            onChange={(e) => setTermosAceitos(e.target.checked)}
            className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "termos-error" : undefined}
          />
          <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
            Eu li e aceito os Termos de Serviço e a Política de Privacidade.
          </span>
        </label>
        {error && (
          <p id="termos-error" className="mt-2 text-sm text-red-600 ml-8" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Voltar
        </Button>
        {!isConfirmed ? (
          <Button
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Confirmar Ação
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Avançar
          </Button>
        )}
      </div>
    </div>
  );
};

// Componente Passo 3
const Step3 = ({ nome, onFinish, onBack }) => {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="w-full flex-shrink-0 px-8">
      <h2 ref={headingRef} className="text-2xl font-bold text-gray-900 mb-4" tabIndex={-1}>
        Passo 3: Revisão e Conclusão
      </h2>
      <p className="text-gray-600 mb-6">
        Tudo pronto, <strong>{nome || "Usuário"}</strong>! Revise suas informações e finalize o fluxo.
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-gray-900 font-medium">Status do Nome:</span>
          <span className="text-green-600 font-semibold">Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-gray-900 font-medium">Status dos Termos:</span>
          <span className="text-green-600 font-semibold">Aceitos</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Voltar
        </Button>
        <Button
          onClick={onFinish}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Finalizar Fluxo
        </Button>
      </div>
    </div>
  );
};

// Componente Tela de Sucesso
const SuccessScreen = () => {
  return (
    <div className="w-full flex-shrink-0 px-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Fluxo Concluído com Sucesso!
        </h2>
        
        <p className="text-gray-600 text-lg mb-8">
          Parabéns, você completou todas as etapas obrigatórias.
        </p>

        <Link to={createPageUrl("Home")}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Componente Principal
export default function FluxoStepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmedSteps, setConfirmedSteps] = useState({ 1: false, 2: false });
  const [nome, setNome] = useState("");
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [errors, setErrors] = useState({ step1: "", step2: "" });

  const handleConfirmStep1 = () => {
    if (!nome.trim()) {
      setErrors({ ...errors, step1: "Por favor, insira seu nome para continuar." });
      return;
    }
    setErrors({ ...errors, step1: "" });
    setConfirmedSteps({ ...confirmedSteps, 1: true });
  };

  const handleConfirmStep2 = () => {
    if (!termosAceitos) {
      setErrors({ ...errors, step2: "Você precisa aceitar os termos para continuar." });
      return;
    }
    setErrors({ ...errors, step2: "" });
    setConfirmedSteps({ ...confirmedSteps, 2: true });
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishFlow = () => {
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fluxo Interativo Stepper</h1>
            <p className="text-gray-600">Complete todas as etapas para finalizar</p>
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Indicadores - Não mostrar na tela de sucesso */}
          {currentStep < 4 && (
            <StepIndicators currentStep={currentStep} confirmedSteps={confirmedSteps} />
          )}

          {/* Track de Passos com Transição Slide */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
            >
              {/* Passo 1 */}
              <Step1
                nome={nome}
                setNome={setNome}
                onConfirm={handleConfirmStep1}
                isConfirmed={confirmedSteps[1]}
                onNext={nextStep}
                error={errors.step1}
              />

              {/* Passo 2 */}
              <Step2
                termosAceitos={termosAceitos}
                setTermosAceitos={setTermosAceitos}
                onConfirm={handleConfirmStep2}
                isConfirmed={confirmedSteps[2]}
                onNext={nextStep}
                onBack={prevStep}
                error={errors.step2}
              />

              {/* Passo 3 */}
              <Step3
                nome={nome}
                onFinish={finishFlow}
                onBack={prevStep}
              />

              {/* Tela de Sucesso (4º slide) */}
              <SuccessScreen />
            </div>
          </div>
        </div>

        {/* Informação de Progresso */}
        {currentStep < 4 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Passo {currentStep} de 3
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RendezVous } from '../models/RendezVous';
import { getCurrentUser } from '../utils/authFrontend';

// Interface pour les messages du chat
export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  action?: string;
  appointmentData?: Partial<RendezVous>;
}

// Interface pour les suggestions
export interface Suggestion {
  text: string;
  action: () => void;
}

const Chatbot = () => {
  const location = useLocation();
  
  // Récupérer l'utilisateur connecté et déterminer son rôle
  const user = getCurrentUser();
  const userRole = user?.role === 'MEDECIN' ? 'doctor' : 'patient';
  const userId = user?.id || '';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: `Bonjour ! Je suis votre assistant médical. Comment puis-je vous aider aujourd'hui ?\n\nExemples:\n- "Je voudrais prendre un rendez-vous"
- "Quels sont mes rendez-vous aujourd'hui ?"
- "Quelles sont vos disponibilités ?"`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Utilisateur');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Récupérer le nom de l'utilisateur connecté
  useEffect(() => {
    if (user?.nom) {
      setUserName(user.nom);
    }
  }, [user?.nom]);

  // Faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suggestions rapides
  const suggestions: Suggestion[] = [
    {
      text: 'Prendre un rendez-vous',
      action: () => sendMessage('Je voudrais prendre un rendez-vous'),
    },
    {
      text: 'Voir mes rendez-vous',
      action: () => sendMessage('Quels sont mes rendez-vous aujourd\'hui ?'),
    },
    {
      text: 'Disponibilités',
      action: () => sendMessage('Quelles sont vos disponibilités cette semaine ?'),
    },
    {
      text: 'Annuler un RDV',
      action: () => sendMessage('Je veux annuler mon rendez-vous'),
    },
  ];

  // Envoyer un message
  const sendMessage = async (message?: string) => {
    const text = message || inputValue.trim();
    if (!text) return;

    // Réinitialiser l'erreur et l'input
    setError(null);
    setInputValue('');

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Appel à l'API backend avec l'historique de conversation
      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          userId,
          userRole,
          userName,
          // Envoyer l'historique de conversation pour que l'IA ait le contexte
          conversationHistory: messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          conversationId: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur de connexion au serveur');
      }

      const data = await response.json();

      // Mettre à jour le conversationId si présent dans la réponse
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Ajouter la réponse de l'IA
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.reply || "Je n'ai pas pu obtenir de réponse.",
        timestamp: new Date(),
        action: data.action,
        appointmentData: data.appointmentData,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Si un RDV a été demandé, afficher une notification
      if (data.action === 'appointment_requested') {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              role: 'ai',
              content: 'Votre demande de rendez-vous a été enregistrée. Un email de confirmation vous sera envoyé.',
              timestamp: new Date(),
              action: 'confirmation',
            },
          ]);
        }, 1000);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      
      // Message d'erreur plus spécifique
      let errorReply = "Désolé, je n'ai pas pu traiter votre demande.";
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorReply = "Désolé, impossible de contacter le serveur. Veuillez vérifier votre connexion internet et réessayer.";
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        errorReply = "Désolé, la ressource demandée n'est pas disponible.";
      } else {
        errorReply = "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer plus tard.";
      }
      
      // Ajouter un message d'erreur
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: errorReply,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer l'envoi avec la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formater l'heure d'un message
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Basculer l'affichage du chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Ne pas afficher si l'utilisateur n'est pas connecté ou sur les pages publiques
  const publicRoutes = ['/', '/register', '/reset-password', '/reset-password/confirm'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  if (!user || isPublicRoute) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bouton flottant pour ouvrir le chat */}
      <button
        onClick={toggleChat}
        className="flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {isOpen ? null : (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">1</span>
          </span>
        )}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* En-tête du chat */}
          <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Bonjour {userName} !</h3>
                <p className="text-xs text-gray-400">
                  {userRole === 'doctor' ? 'Mode Médecin' : 'Mode Patient'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Zone des messages */}
          <div className="p-4 h-80 md:h-96 overflow-y-auto bg-slate-800">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>Commencez une conversation...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-200'}`}
                    >
                      <div className="flex items-end gap-2">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      {/* Indication pour les actions spéciales */}
                      {message.action === 'appointment_requested' && (
                        <div className="mt-2 p-2 bg-green-900/30 rounded-lg text-xs">
                          ⚡ Demande de RDV en cours...
                        </div>
                      )}
                      {message.action === 'confirmation' && (
                        <div className="mt-2 p-2 bg-green-900/50 rounded-lg text-xs">
                          ✅ Confirmation envoyée
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-100">.</span>
                        <span className="animate-pulse delay-200">.</span>
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-center">
                    <div className="bg-red-900/50 rounded-lg px-4 py-2 text-sm text-red-300">
                      {error}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggestions rapides */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={suggestion.action}
                    className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-full transition-colors"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zone d'input */}
          <div className="p-4 border-t border-slate-700 bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

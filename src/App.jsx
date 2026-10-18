// App.jsx
import React, { useState, useEffect } from 'react';
import { setupProfileAgent, generateDailyPlanner } from './ai-agents';

function App() {
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: 'Alex',
    goals: 'Become a full-stack engineer and get hired at a top tier remote company',
    subjects: 'React, Node.js, AI Integration',
    level: 'Intermediate',
    hours: '2'
  });

  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      setHasProfile(true);
      fetchTodaySchedule(JSON.parse(saved));
    }
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Step 1: Hit Agent 1 Setup Profile to structure master curriculum (mock / initial step)
      // Usually, we just save the context locally:
      localStorage.setItem('user_profile', JSON.stringify(profileForm));
      localStorage.setItem('day', '1');
      setHasProfile(true);
      
      // Immediately run Agent 2 Planner to get today's sessions
      await fetchTodaySchedule(profileForm);
    } catch (err) {
      console.error(err);
      alert("Error setting up profile or planning: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async (prof) => {
    setLoading(true);
    try {
      const currentDay = localStorage.getItem('day') || '1';
      const response = await generateDailyPlanner({
        ...prof,
        day: currentDay,
        sessionsList: localStorage.getItem('session_history') || '[]'
      });
      setSchedule(response);
    } catch (err) {
      console.error(err);
      alert("Make sure you put OPENAI_API_KEY in ai-agents.js. Error fetching schedule: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.clear();
    setHasProfile(false);
    setSchedule(null);
  };

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <h1>Sync <span>// AI Scheduler OS</span></h1>
        {hasProfile && <button className="btn-secondary" onClick={handleReset}>Reset Profile</button>}
      </header>

      <main className="main-content">
        {!hasProfile ? (
          <section className="glass-card wizard-card slide-up">
            <h2>Welcome. Let's build your routine.</h2>
            <p>Tell the AI setup agent about your goals and available time.</p>
            <form onSubmit={handleSaveProfile} className="profile-form">
              <label>Name</label>
              <input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
              
              <label>Ultimate Goals</label>
              <input value={profileForm.goals} onChange={e => setProfileForm({...profileForm, goals: e.target.value})} />
              
              <label>Subjects/Tech to Learn</label>
              <input value={profileForm.subjects} onChange={e => setProfileForm({...profileForm, subjects: e.target.value})} />
              
              <label>Current Skill Level</label>
              <input value={profileForm.level} onChange={e => setProfileForm({...profileForm, level: e.target.value})} />

              <label>Daily Available Hours</label>
              <input type="number" min="1" max="16" value={profileForm.hours} onChange={e => setProfileForm({...profileForm, hours: e.target.value})} />
              
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Initializing Agent...' : 'Generate Curriculum Context'}
              </button>
            </form>
          </section>
        ) : (
          <section className="dashboard-view slide-up">
            <h2 className="greeting">Good Morning, {JSON.parse(localStorage.getItem('user_profile'))?.name}.</h2>
            <div className="stats-row">
              <div className="stat-card">
                <h3>Day</h3>
                <p className="value">{localStorage.getItem('day')}</p>
              </div>
              <div className="stat-card">
                <h3>Today's Target</h3>
                <p className="value">{JSON.parse(localStorage.getItem('user_profile'))?.hours} Hours</p>
              </div>
            </div>

            <div className="glass-card big-card">
              <h3>Today's Recommended AI Schedule</h3>
              {loading && <div className="loader">Agent 2 (Planner) is building your schedule...</div>}
              {!loading && schedule && schedule.sessions ? (
                <ul className="sessions-list">
                  {schedule.sessions.map((session, i) => (
                    <li key={i} className="session-item">
                      <div className="session-time">{session.time || "Session " + (i+1)}</div>
                      <div className="session-details">
                        <h4>{session.topic || session.title}</h4>
                        <p>{session.description || "Focus on building your mental model."}</p>
                        <button className="btn-outline">Start Working (Agent 3)</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                !loading && <p className="empty-state">No schedule generated or invalid JSON response. Please check your API key.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

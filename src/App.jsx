import { useCallback, useEffect, useMemo, useState } from 'react';
import AgentInsights from './components/AgentInsights';
import CaseDetail from './components/CaseDetail';
import CaseFinder from './components/CaseFinder';
import CaseTable from './components/CaseTable';
import Dashboard from './components/Dashboard';
import { AppTopBar, DataRefreshBar, SearchBar } from './components/Layout';
import ChatPresenceBar from './components/ChatPresenceBar';
import CommunityChatPanel from './components/CommunityChatPanel';
import MyUSCISCase from './components/MyUSCISCase';
import RedditInsights from './components/RedditInsights';
import Tutorial from './components/Tutorial';
import { useTheme } from './hooks/useTheme';
import { useCommunityChat } from './hooks/useCommunityChat';
import { CASE_SHEETS } from './config';
import { buildCaseGuidance } from './utils/advisoryService';
import {
  buildInsights,
  estimateForCase,
  fetchAllData,
  filterCases,
  findSimilarCases,
  getBlockProgress,
  uniqueCountryValues,
  uniqueValues,
} from './utils/dataService';
import { fetchRedditFeed } from './utils/redditService';

const DEFAULT_FILTERS = {
  query: '',
  category: 'all',
  status: 'all',
  fieldOffice: 'all',
  country: 'all',
  sheet: 'all',
  receiptMonth: 'all',
};

export default function App() {
  const { preference, resolved, setPreference } = useTheme();
  const chat = useCommunityChat();
  const [cases, setCases] = useState([]);
  const [agents, setAgents] = useState([]);
  const [rules, setRules] = useState({ rulesText: '', links: [] });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('my-uscis');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedCase, setSelectedCase] = useState(null);
  const [redditFeed, setRedditFeed] = useState(null);
  const [redditError, setRedditError] = useState('');
  const [redditLoading, setRedditLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllData();
      setCases(data.cases);
      setAgents(data.agents);
      setRules(data.rules);
      setErrors(data.errors);
      setLastUpdated(new Date());
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRedditFeed = useCallback(async () => {
    setRedditLoading(true);
    try {
      const feed = await fetchRedditFeed();
      setRedditFeed(feed);
      setRedditError('');
    } catch (error) {
      setRedditError(error.message);
    } finally {
      setRedditLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadRedditFeed();
  }, [loadData, loadRedditFeed]);

  const filteredCases = useMemo(
    () => filterCases(cases, filters),
    [cases, filters]
  );

  const insights = useMemo(() => buildInsights(filteredCases), [filteredCases]);

  const filterOptions = useMemo(
    () => ({
      categories: uniqueValues(cases, 'category'),
      fieldOffices: uniqueValues(cases, 'fieldOffice'),
      countries: uniqueCountryValues(cases),
      sheets: CASE_SHEETS.map((sheet) => sheet.name),
      receiptMonths: CASE_SHEETS.filter((sheet) => sheet.receiptMonth).map((sheet) => ({
        value: sheet.receiptMonth,
        label: sheet.name,
      })),
    }),
    [cases]
  );

  const chartKey = useMemo(
    () =>
      [
        filters.country,
        filters.category,
        filters.status,
        filters.fieldOffice,
        filters.receiptMonth,
        filters.sheet,
        filters.query,
      ].join('|'),
    [filters]
  );

  const similarCases = useMemo(
    () => (selectedCase ? findSimilarCases(cases, selectedCase) : []),
    [cases, selectedCase]
  );

  const estimate = useMemo(
    () => (selectedCase ? estimateForCase(selectedCase, similarCases) : null),
    [selectedCase, similarCases]
  );

  const blockProgress = useMemo(
    () => (selectedCase?.blockNumber ? getBlockProgress(cases, selectedCase.blockNumber) : null),
    [cases, selectedCase]
  );

  const guidance = useMemo(
    () =>
      selectedCase
        ? buildCaseGuidance({
            target: selectedCase,
            similarCases,
            agents,
            estimate,
            blockProgress,
          })
        : null,
    [selectedCase, similarCases, agents, estimate, blockProgress]
  );

  const handleSelectCase = (record) => {
    setSelectedCase(record);
    setActiveTab('detail');
  };

  const showFilters = !['my-uscis', 'finder', 'tutorial', 'agents', 'reddit'].includes(activeTab);
  const showDataRefresh = ['dashboard', 'cases', 'detail', 'agents', 'finder'].includes(activeTab);

  return (
    <div className="app-shell">
      <AppTopBar
        activeTab={activeTab}
        onChange={setActiveTab}
        themePreference={preference}
        onThemeChange={setPreference}
        chatSlot={
          <ChatPresenceBar
            configured={chat.configured}
            onlineCount={chat.onlineCount}
            onOpenChat={() => chat.setChatOpen(true)}
          />
        }
      />

      {showDataRefresh ? (
        <DataRefreshBar
          loading={loading}
          lastUpdated={lastUpdated}
          caseCount={cases.length}
          onRefresh={loadData}
          errors={errors}
        />
      ) : null}

      {showFilters ? (
        <SearchBar filters={filters} options={filterOptions} onChange={setFilters} />
      ) : null}

      {loading && !cases.length ? (
        <div className="loading-state">Loading tracker data…</div>
      ) : null}

      {activeTab === 'my-uscis' ? (
        <MyUSCISCase
          communityCases={cases}
          agents={agents}
          onSelectCommunityCase={handleSelectCase}
          onGoToFinder={() => setActiveTab('finder')}
          onGoToTutorial={() => setActiveTab('tutorial')}
          theme={resolved}
        />
      ) : null}

      {activeTab === 'finder' ? (
        <CaseFinder cases={cases} onSelectCase={handleSelectCase} />
      ) : null}

      {activeTab === 'dashboard' ? (
        <Dashboard insights={insights} cases={filteredCases} filters={filters} chartKey={chartKey} theme={resolved} />
      ) : null}

      {activeTab === 'cases' ? (
        <CaseTable
          cases={filteredCases}
          selectedId={selectedCase?.id}
          onSelectCase={handleSelectCase}
        />
      ) : null}

      {activeTab === 'detail' ? (
        <CaseDetail
          record={selectedCase}
          estimate={estimate}
          guidance={guidance}
          blockProgress={blockProgress}
          similarCases={similarCases}
          onSelectCase={handleSelectCase}
        />
      ) : null}

      {activeTab === 'agents' ? (
        <AgentInsights agents={agents} rules={rules} />
      ) : null}

      {activeTab === 'reddit' ? (
        <RedditInsights
          feed={redditFeed}
          loading={redditLoading}
          error={redditError}
          onRefresh={loadRedditFeed}
        />
      ) : null}

      {activeTab === 'tutorial' ? <Tutorial /> : null}

      <CommunityChatPanel
        open={chat.chatOpen}
        onClose={() => chat.setChatOpen(false)}
        configured={chat.configured}
        ready={chat.ready}
        loading={chat.loading}
        sending={chat.sending}
        error={chat.error}
        profile={chat.profile}
        messages={chat.messages}
        onlineCount={chat.onlineCount}
        authorId={chat.authorId}
        canChat={chat.canChat}
        sendMessage={chat.sendMessage}
      />

      <footer className="app-footer">
        <p>Informational only — not legal advice or official USCIS guidance. USCIS JSON is processed locally in your browser.</p>
      </footer>
    </div>
  );
}

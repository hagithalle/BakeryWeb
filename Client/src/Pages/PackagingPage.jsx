import React, { useState, useMemo } from "react";
import { Box } from "@mui/material";
import GenericTable from "../Components/GenericTable";
import PackagingDialog from "../Components/PackagingDialog";
import useLocaleStrings from "../hooks/useLocaleStrings";
import { useLanguage } from "../context/LanguageContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPackaging, addPackaging, deletePackaging, editPackaging } from '../Services/packagingService';

export default function PackagingPage() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackaging, setSelectedPackaging] = useState(null);
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['packaging'],
    queryFn: fetchPackaging
  });
  const columns = [
    { field: "name", headerName: strings.sidebar?.packaging || "שם" },
    { field: "cost", headerName: strings.packaging?.cost || "עלות" },
    { field: "stockUnits", headerName: strings.packaging?.stockUnits || "יחידות במלאי" }
  ];
  const filteredRows = useMemo(() => {
    return rows.filter(row => row.name.includes(search));
  }, [search, rows]);
console.log("Packaging:", rows);
  const mutation = useMutation({
    mutationFn: addPackaging,
    onSuccess: () => queryClient.invalidateQueries(['packaging'])
  });
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <input
          type="text"
          placeholder={strings.filter?.search || "חפש לפי שם"}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            fontSize: 18,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #751B13',
            fontFamily: 'Suez One, serif',
            marginLeft: 8,
            minWidth: 220
          }}
        />
      </Box>
      {/* טבלה מוצגת פעם אחת בלבד */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
        <button
          style={{
            background: '#751B13',
            color: 'white',
            fontFamily: 'Suez One, serif',
            fontSize: 18,
            border: 'none',
            borderRadius: 8,
            padding: '10px 28px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0001',
            transition: 'background 0.2s',
            marginLeft: 0,
            marginRight: 0
          }}
          onClick={() => {
            setSelectedPackaging(null);
            setDialogOpen(true);
          }}
        >
          {strings.packaging?.add || "הוסף מוצר אריזה"}
        </button>
      </Box>
      <GenericTable
        columns={columns}
        rows={filteredRows}
        direction={strings.direction}
        actions={["edit", "delete"]}
        onEdit={row => {
          setSelectedPackaging(row);
          setDialogOpen(true);
        }}
        onDelete={row => {
          if (window.confirm("האם למחוק את " + row.name + "?")) {
            deleteMutation.mutate(row.id);
          }
        }}
      />
      <PackagingDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedPackaging(null);
        }}
        onSave={pkg => {
          if (selectedPackaging) {
            editMutation.mutate({ ...selectedPackaging, ...pkg });
          } else {
            mutation.mutate(pkg);
          }
          setDialogOpen(false);
          setSelectedPackaging(null);
        }}
        strings={strings}
        initialValues={selectedPackaging}
      />
    </Box>
  );
}

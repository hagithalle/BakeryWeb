import React, { useState, useMemo } from "react";
import { Box, TextField } from "@mui/material";
import GenericTable from "../Components/GenericTable";
import PackagingDialog from "../Components/PackagingDialog";
import AddButton from "../Components/AddButton";
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

  const mutation = useMutation({
    mutationFn: addPackaging,
    onSuccess: () => queryClient.invalidateQueries(['packaging'])
  });

  const editMutation = useMutation({
    mutationFn: editPackaging,
    onSuccess: () => queryClient.invalidateQueries(['packaging'])
  });

  const deleteMutation = useMutation({
    mutationFn: deletePackaging,
    onSuccess: () => queryClient.invalidateQueries(['packaging'])
  });

  return (
    <Box>
      {/* Header with Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <AddButton
          onClick={() => {
            setSelectedPackaging(null);
            setDialogOpen(true);
          }}
        >
          {strings.packaging?.add || "הוסף מוצר אריזה"}
        </AddButton>
      </Box>

      {/* Search Section */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder={strings.filter?.search || "חפש לפי שם..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ 
            flexGrow: 1,
            minWidth: 250,
            backgroundColor: '#FEFEFE',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: '#D2A5A0'
              }
            }
          }}
        />
      </Box>

      {/* Table */}
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
